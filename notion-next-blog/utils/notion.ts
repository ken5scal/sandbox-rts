import { Client } from "@notionhq/client";

const notionClient = new Client({ auth: process.env.NOTION_KEY as string})
const DATABASE_ID = process.env.NOTION_DATABASE_ID as string

export const fetchPages = async() => {
    return await notionClient.databases.query({
        database_id: DATABASE_ID,
    })
}