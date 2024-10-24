const path = require('path');
const express = require('express');
const OpenAI = require('openai');
const dotenv = require('dotenv');

console.log('Diretório atual:', __dirname);

const envPath = path.join(__dirname, '.env');
console.log('Caminho do arquivo .env:', envPath);

dotenv.config({ path: envPath });

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const SHOPEE_AFFILIATE_ID = '18370000390';

function generateShopeeAffiliateLink(productName) {
    const encodedName = encodeURIComponent(productName);
    const baseUrl = 'https://shopee.com.br/search';
    const affiliateParams = `af_id=${SHOPEE_AFFILIATE_ID}&af_click_lookback=7d`;
    return `${baseUrl}?keyword=${encodedName}&${affiliateParams}`;
}

function extractProductInfo(text) {
    const parts = text.split(' - ');
    let name = '', description = '', price = 0;

    if (parts.length >= 1) name = parts[0].trim();
    if (parts.length >= 2) description = parts[1].trim();
    if (parts.length >= 3) {
        const priceMatch = parts[2].match(/R?\$?\s?(\d+(?:[.,]\d{1,2})?)/);
        price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
    }

    return { name, description, price };
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/analyze', async (req, res) => {
    console.log('Requisição recebida em /analyze');
    try {
        const { problem } = req.body;
        console.log('Problema recebido:', problem);

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {"role": "system", "content": "Você é um assistente que sugere produtos para resolver problemas."},
                {"role": "user", "content": `Dado o seguinte problema: "${problem}", sugira 1 produto que possa resolver este problema. Forneça o nome do produto, uma breve descrição e um preço estimado. Formate a resposta como: Nome do Produto - Descrição - Preço`}
            ],
            max_tokens: 100,
            n: 1,
            temperature: 0.7,
        });

        console.log('Resposta da OpenAI:', completion.choices[0].message.content);

        const { name, description, price } = extractProductInfo(completion.choices[0].message.content);
        const product = {
            name,
            description,
            price,
            link: generateShopeeAffiliateLink(name)
        };

        console.log('Produto processado:', product);

        res.json({ products: [product] });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ error: 'Erro ao processar a solicitação', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});