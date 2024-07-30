document.getElementById('fetchData').addEventListener('click', function() {
    const symbol = document.getElementById('symbol').value;
    const period = document.getElementById('period').value;

    console.log(`Fetching data for symbol: ${symbol} with period: ${period}`);
    console.log(symbol)
    console.log(period)

    fetch(`/api/stock/${symbol}?period=${period}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.json();
        })
        .then(result => {
            const { stock_info, data, quarterly_data, annual_data} = result;
            if (!data.length) {
                alert('No data found for the given symbol and period.');
                return;
            }

            console.log('Fetched data:', data);

            const labels = data.map(entry => entry.Date);
            const prices = data.map(entry => entry.Close);

            const ctx = document.getElementById('stockChart').getContext('2d');
            if (window.stockChart instanceof Chart) {
                console.log('Destroying existing chart instance');
                window.stockChart.destroy();
            } else{
                console.log('No existing chart instance to destroy');
            }

            window.stockChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `${symbol} Stock Price`,
                        data: prices,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        fill: false
                    }]
                },
                options: {
                    scales: {
                        x: { type: 'time', time: { unit: 'day' } },
                        y: { beginAtZero: false }
                    }
                }
            });

            console.log('New chart instance created:', window.stockChart);

            // Update stock statistics
            document.getElementById('currentPrice').textContent = stock_info.current_price;
            document.getElementById('marketCap').textContent = stock_info.market_cap;
            document.getElementById('trailingPERatio').textContent = stock_info.trailing_pe_ratio;
            document.getElementById('forwardPERatio').textContent = stock_info.forward_pe_ratio;
            document.getElementById('dividendYield').textContent = stock_info.dividend_yield;
            document.getElementById('fiftyTwoWeekHigh').textContent = stock_info['52_week_high'];
            document.getElementById('fiftyTwoWeekLow').textContent = stock_info['52_week_low'];

            // Update quarterly income statements
            const quarterlyDataBody = document.getElementById('quarterlyDataBody');
            quarterlyDataBody.innerHTML = '';
            quarterly_data.forEach(q => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${q.date}</td>
                    <td>${q.revenue}</td>
                    <td>${q.net_income}</td>
                    <td>${q.diluted_eps}</td>
                    <td>${q.net_profit_margin}</td>
                `;
                quarterlyDataBody.appendChild(row);
            });

            // Update annual income statements
            const annualDataBody = document.getElementById('annualDataBody');
            annualDataBody.innerHTML = '';
            annual_data.forEach(a => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${a.date}</td>
                    <td>${a.revenue}</td>
                    <td>${a.net_income}</td>
                    <td>${a.diluted_eps}</td>
                    <td>${a.net_profit_margin}</td>
                `;
                annualDataBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error fetching stock data:', error);
            console.log(error);
            alert('Failed to fetch stock data. Please try again later.');
        });
});
