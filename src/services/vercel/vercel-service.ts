import axios from "axios";

export class VercelService {
    private api = axios.create({
        baseURL: `${process.env.VERCEL_API}`,
        headers: {
            Authorization: `Bearer ${process.env.NEXT_TOKEN}`,
        },
    });

    async addDomain(domain: string): Promise<void> {
        await this.api.post(
            `/v10/projects/${process.env.NEXT_PROJECTID}/domains`,
            { name: domain }
        );
    }

    async removeDomain(domain: string): Promise<void> {
        await this.api.delete(
            `/v10/projects/${process.env.NEXT_PROJECTID}/domains/${domain}`
        );
    }
}
