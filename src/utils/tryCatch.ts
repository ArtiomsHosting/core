export default async function tryCatch<T>(
    promise: Promise<T>
): Promise<[T, Error | null]> {
    try {
        const result = await promise;
        return [result, null];
    } catch (error) {
        return [
            null as T,
            error instanceof Error ? error : new Error(String(error)),
        ];
    }
}
