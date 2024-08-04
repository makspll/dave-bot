import { escapeMarkdown } from './markdown.js';

it('escapeMarkdown should escape special characters', () => {
    const input = 'This is a **bold** text with _italic_ and [link](https://example.com).';
    const expectedOutput = 'This is a \\*\\*bold\\*\\* text with \\_italic\\_ and \\[link\\]\\(https://example\\.com\\)\\.';

    const output = escapeMarkdown(input);

    expect(output).toBe(expectedOutput);
});