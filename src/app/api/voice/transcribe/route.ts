import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        const apiKey = process.env.DEEPGRAM_API_KEY;
        if (!apiKey) {
            throw new Error("DEEPGRAM_API_KEY not found");
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=zh", {
            method: "POST",
            headers: {
                "Authorization": `Token ${apiKey}`,
                "Content-Type": file.type || "audio/wav",
            },
            body: buffer,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Deepgram Error:", response.status, errorText);
            throw new Error(`Deepgram API failed: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        // Parse result: results.channels[0].alternatives[0].transcript
        const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

        return NextResponse.json({ transcript });

    } catch (error: any) {
        console.error("Error transcribing voice:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
