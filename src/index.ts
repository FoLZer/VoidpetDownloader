import fetch from "node-fetch";

export async function downloadVoidpetWebsite() {
    const link = "https://voidpet.com"
    //parse index html to find _buildManifest.js link
    const buildManifest = await parseIndex(link);
    //download _buildManifest.js
    const buildManifestLink = `${link}/_next/static/${buildManifest}/_buildManifest.js`;
    const buildManifestResponse = await fetch(buildManifestLink);
    const buildManifestText = await buildManifestResponse.text();
    //parse _buildManifest.js to find all files and folders
    //links start with static/ and end in .js
    const regex = /static\/([a-zA-Z0-9-_]+)\/([a-zA-Z0-9-_]+)\.js/g;
    const matches = [];
    let match;
    while ((match = regex.exec(buildManifestText)) !== null) {
        matches.push(match);
    }
    const res: {[fileName: string]: string} = {};
    //download all files and folders
    for (const match of matches) {
        const fileLink = `${link}/_next/static/${match[1]}/${match[2]}.js`;
        const fileResponse = await fetch(fileLink);
        const fileText = await fileResponse.text();
        const fileName = `${match[1]}/${match[2]}.js`;
        res[fileName] = fileText;
    }
    return res;
}

async function parseIndex(link: string) {
    const response = await fetch(link);
    const text = await response.text();
    const regex = /\/_next\/static\/([a-zA-Z0-9-_]+)\/_buildManifest.js/g;
    const match = regex.exec(text);
    if (match) {
        return match[1];
    }
    return null;
}