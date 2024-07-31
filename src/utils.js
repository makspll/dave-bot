import stringWidth from "string-width";

export function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function stringPad(string, target_length, fill = ' ', align = 'left') {
    let padding_required = target_length - stringWidth (string);
    if (padding_required <= 0) {
        return string;
    }
    let left_padding = Math.floor(padding_required / 2);
    let right_padding = padding_required - left_padding;
    if (align == 'left') {
        right_padding = left_padding + right_padding;
        left_padding = 0;
    } else if (align == 'right') {
        left_padding = left_padding + right_padding;
        right_padding = 0;
    }

    return fill.repeat(left_padding) + string + fill.repeat(right_padding);
}