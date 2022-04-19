import fetch from "node-fetch";

export async function downloadVoidpetWebsite() {
    const link = "https://voidpet.com"
    const matches: RegExpExecArray[] = [];
    //parse index html to find _buildManifest.js link
    const {buildManifest, indexLinks} = await parseIndex(link);
    if(!buildManifest || !indexLinks) {
        throw new Error("Could not find buildManifest or indexLinks");
    }
    matches.push(...indexLinks);
    //download _buildManifest.js
    const buildManifestLink = `${link}/_next/static/${buildManifest}/_buildManifest.js`;
    const buildManifestResponse = await fetch(buildManifestLink);
    const buildManifestText = await buildManifestResponse.text();
    //parse _buildManifest.js to find all files and folders
    //links start with static/ and end in .js
    const regex = /static\/([a-zA-Z0-9-_]+)\/([a-zA-Z0-9-_]+)\.js/g;
    
    const cont = (x: String) => {
        for(let i=0;i<matches.length;i++) {
            if(matches[i][0] === x) {
                return true;
            }
        }
        return false;
    }
    let match;
    while ((match = regex.exec(buildManifestText)) !== null) {
        if(cont(match[0])) {
            matches.push(match);
        }
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
    const regex = /static\/([a-zA-Z0-9-_]+)\/_buildManifest.js/g;
    //regex to match js links in index.html
    const regex2 = /static\/([a-zA-Z0-9-_]+)\/([a-zA-Z0-9-_]+)\.js/g;
    const match = regex.exec(text);
    const matches = [];
    {
        let match;
        while ((match = regex2.exec(text)) !== null) {
            if(match[0].includes("webpack")) {
                continue;
            }
            matches.push(match);
        }
    }
    const regex3 = /static\/([a-zA-Z0-9-_]+)\/pages\/_app-([a-zA-Z0-9-_]+)\.js/g
    const match2 = regex3.exec(text);
    if(match2) {
        matches.push(match2);
    }
    return {buildManifest: match ? match[1] : null, indexLinks: matches};
}