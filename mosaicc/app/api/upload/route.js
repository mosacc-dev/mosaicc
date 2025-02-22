import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(req) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json({ error: "Missing env variables" }, { status: 500 });
    }
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const blob = await put(file.name, file, {
        access: "public",
        contentType: file.type, 
    });

    return NextResponse.json({ url: blob.url });
}
