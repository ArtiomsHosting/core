export function expiresIn(ms: number): number {
    return Math.round(ms / 1000);
}

export function expiresAt(ms: number): Date {
    return new Date(Date.now() + ms);
}

export function toMs(timeStr: string): number {
    const regex = /(\d+)([a-zA-Z]+)/g;
    let ms = 0;

    let match;
    while ((match = regex.exec(timeStr)) !== null) {
        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();

        switch (unit) {
            case "d":
                ms += value * 24 * 60 * 60 * 1000;
                break;
            case "h":
                ms += value * 60 * 60 * 1000;
                break;
            case "m":
                ms += value * 60 * 1000;
                break;
            case "s":
                ms += value * 1000;
                break;
            case "y":
                ms += value * 365.25 * 24 * 60 * 60 * 1000;
                break;
            case "mo":
                ms += value * 30.44 * 24 * 60 * 60 * 1000;
                break;
            case "w":
                ms += value * 7 * 24 * 60 * 60 * 1000;
                break;
            default:
                throw new Error(`Unsupported time unit: ${unit}`);
        }
    }

    return ms;
}
