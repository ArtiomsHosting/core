import bcrypt from "bcrypt";

export const hash = async (plainText: string): Promise<string> => {
    try {
        const saltRounds = Number(process.env.HASHING_SALT) || 10;
        const hashedValue = await bcrypt.hash(plainText, saltRounds);
        return hashedValue;
    } catch (error) {
        throw new Error("Error generating hash");
    }
};

export const compare = async (
    plainText: string,
    hashValue: string
): Promise<boolean> => {
    try {
        const isMatch = await bcrypt.compare(plainText, hashValue);
        return isMatch;
    } catch (error) {
        throw new Error("Error comparing hash");
    }
};

export const base64 = {
    encode: (p: any) => Buffer.from(p.toString()).toString("base64"),
    decode: (p: any) => Buffer.from(p, "base64").toString(),
};
