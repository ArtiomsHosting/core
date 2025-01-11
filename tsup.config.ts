import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src"],
    splitting: true,
    silent: true,
    clean: true,
});
