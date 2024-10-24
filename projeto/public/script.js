document.addEventListener('DOMContentLoaded', () => {
    const problemInput = document.getElementById('problemInput');
    const submitBtn = document.getElementById('submitBtn');
    const resultsDiv = document.getElementById('results');

    submitBtn.addEventListener('click', async () => {
        const problem = problemInput.value.trim();
        if (!problem) {
            alert('Por favor, descreva um problema.');
            return;
        }

        resultsDiv.innerHTML = '<p>Buscando soluções...</p>';

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ problem }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro na resposta do servidor: ${response.status}. Detalhes: ${errorData.error}, ${errorData.details}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            displayResults(data.products);
        } catch (error) {
            resultsDiv.innerHTML = `<p>Erro: ${error.message}</p>`;
            console.error('Erro detalhado:', error);
        }
    });

    function displayResults(products) {
        if (!products || products.length === 0) {
            resultsDiv.innerHTML = '<p>Nenhum produto encontrado.</p>';
            return;
        }

        resultsDiv.innerHTML = '<h2>Produto Recomendado:</h2>';
        products.forEach(product => {
            resultsDiv.innerHTML += `
                <div class="product">
                    <h3>${escapeHtml(product.name)}</h3>
                    <p>${escapeHtml(product.description)}</p>
                    <p><strong>Preço estimado:</strong> R$ ${product.price.toFixed(2)}</p>
                    <a href="${escapeHtml(product.link)}" target="_blank" rel="noopener noreferrer" class="buy-button">
                        Comprar na Shopee 🛒
                    </a>
                </div>
            `;
        });
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});