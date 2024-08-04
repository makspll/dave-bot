import { setupServer } from 'msw/node'
import { http, HttpResponse, passthrough } from 'msw'
import fs from 'fs'
import path from 'path'
import axios from 'axios'

export function makeMockServer() {
    return setupServer(...[
        http.get('*', async (info) => {
            console.log("REQUEST MOCKED: ", info.request.url)
            if (info.request.headers.has('X-Bypass-Mock')) {
                return passthrough()
            }

            let response;
            let requestPath = info.request.url;
            requestPath = info.request.url.replace('https://', '').replace('http://', '')
            const folderPath = path.join(process.cwd(), 'test_data', requestPath);


            try {
                // record the request
                if (process.env.RECORD_REQUESTS) {
                    console.log("sending record request to: ", info.request.url)
                    const axios_response = await axios.get(info.request.url, {
                        headers: {
                            'X-Bypass-Mock': true
                        }
                    });
                    let data;
                    if (axios_response.headers['content-type'].split(';').includes('application/json')) {
                        data = JSON.stringify(axios_response.data);
                    } else {
                        data = axios_response.data;
                    }
                    console.log("Writing to: ", folderPath)
                    if (!fs.existsSync(path.dirname(folderPath))) {
                        fs.mkdirSync(path.dirname(folderPath), { recursive: true });
                    }
                    fs.writeFileSync(folderPath, data);
                }

                // read the request from storage
                if (!fs.existsSync(folderPath)) {
                    response = HttpResponse.json({
                        error: 'Folder not found',
                    }, { status: 404 });
                }
                const file = fs.readFileSync(folderPath);
                if (path.extname(folderPath) === '.json') {
                    response = HttpResponse.json(JSON.parse(file.toString()));
                } else {
                    response = new HttpResponse(file.toString());
                }
            } catch (error) {
                console.log(info.request)
                console.error('Error reading directory:', folderPath, error);
                response = HttpResponse.json({
                    error: 'Folder not found or unable to read directory',
                }, { status: 404 });
            }

            return response;
        }),
    ])
};

