import fs from "fs";
import Tesseract from "tesseract.js";
import OpenAI from "openai";

// Configuração da API do OpenAI
const apiKey = "chave-api";

const openai = new OpenAI(apiKey);

// Função para extrair texto da imagem usando Tesseract.js
async function extractTextFromImage(imagePath) {
  try {
    const result = await Tesseract.recognize(imagePath, "eng", {
      logger: (m) => console.log(m),
    });
    return result.data.text;
  } catch (error) {
    console.error("Erro ao extrair texto da imagem:", error);
    return null;
  }
}

// Função para formatar o texto usando a API do OpenAI
async function formatTextWithOpenAI(text) {
  const prompt = `
    Extraia os dados do cardápio no seguinte formato:
    Nome do Produto / Descrição / Preço do produto
    ${text}
    `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      top_p: 0.1,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Erro ao chamar a API do OpenAI:", error);
    return null;
  }
}

// Função para formatar a saída em CSV
function formatToCSV(data) {
  const lines = data.split("\n");
  const csvData = lines
    .map((line) => {
      const parts = line.split(" / ");
      if (parts.length === 3) {
        const product = parts[0];
        const description = parts[1].replace(/"/g, '""'); // Escapar aspas duplas dentro da descrição
        const price = parts[2];
        return `"${product}","${description}","${price}"`;
      } else {
        return ""; // linha vazia para ignorar linhas mal formatadas
      }
    })
    .filter((line) => line)
    .join("\n"); // remover linhas vazias
  return csvData;
}

// Função principal para processar a imagem e gerar a planilha
async function processImage(imagePath) {
  try {
    const text = await extractTextFromImage(imagePath);
    const formattedText = await formatTextWithOpenAI(text);

    if (formattedText) {
      const csvHeader = "Nome do Produto,Descrição,Preço\n";
      const csvContent = csvHeader + formatToCSV(formattedText);
      fs.writeFileSync("menu.csv", csvContent, "utf8");
      console.log("Dados do cardápio extraídos e salvos em menu.csv");
    } else {
      console.log("Não foi possível formatar o texto extraído.");
    }
  } catch (error) {
    console.error("Erro ao processar a imagem:", error);
  }
}

// Caminho do arquivo de imagem
const imagePath = "caminho-da-imagem";

// Processar a imagem
processImage(imagePath);
