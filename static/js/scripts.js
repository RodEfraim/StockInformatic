// Helper function to handle NaN, undefined, or null values
function safeValue(value) {
    console.log("You have entered the safeValue function.");
    console.log("value: " + value);
    return (value === undefined || value === null || isNaN(value)) ? 'N/A' : value;
}

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

            // Determine the background color based on the price trend
            const firstPrice = prices[0];
            const lastPrice = prices[prices.length - 1];

            const ctx = document.getElementById('stockChart').getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
            let borderColor;

            if (firstPrice <= lastPrice) {
                // Green gradient if the price increased or stayed the same
                gradient.addColorStop(0, 'rgba(144, 238, 144, 0.4)'); // Light green color at the top (40% opacity)
                gradient.addColorStop(1, 'rgba(144, 238, 144, 0)');   // Transparent at the bottom
                borderColor = 'rgba(34, 139, 34, 1)'; // Darker green border
            } else {
                // Red gradient if the price decreased
                gradient.addColorStop(0, 'rgba(255, 99, 132, 0.4)');  // Light red color at the top (40% opacity)
                gradient.addColorStop(1, 'rgba(255, 99, 132, 0)');    // Transparent at the bottom
                borderColor = 'rgba(255, 0, 0, 1)'; // Red border
            }

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
                        borderColor: borderColor, // Dynamic border color
                        backgroundColor: gradient, // Dynamic background color
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1
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
            document.getElementById('currentPrice').textContent = `$${stock_info.current_price}`;
            document.getElementById('marketCap').textContent = stock_info.market_cap;
            document.getElementById('trailingPERatio').textContent = stock_info.trailing_pe_ratio;
            document.getElementById('forwardPERatio').textContent = stock_info.forward_pe_ratio;

            // Convert dividend yield to percentage and display it
            if(stock_info.dividend_yield != 'N/A'){
                const dividendYield = parseFloat(stock_info.dividend_yield) * 100;
                document.getElementById('dividendYield').textContent = `${dividendYield.toFixed(2)}%`;
            }else{
                document.getElementById('dividendYield').textContent = stock_info.dividend_yield;
            }

            document.getElementById('fiftyTwoWeekHigh').textContent = stock_info['52_week_high'];
            document.getElementById('fiftyTwoWeekLow').textContent = stock_info['52_week_low'];

            /*document.getElementById('currentPrice').textContent = safeValue(stock_info.current_price);
            document.getElementById('marketCap').textContent = safeValue(stock_info.market_cap);
            document.getElementById('peRatio').textContent = safeValue(stock_info.pe_ratio);
            document.getElementById('dividendYield').textContent = safeValue(stock_info.dividend_yield);
            document.getElementById('fiftyTwoWeekHigh').textContent = safeValue(stock_info['52_week_high']);
            document.getElementById('fiftyTwoWeekLow').textContent = safeValue(stock_info['52_week_low']);*/

            // Update quarterly income statements
            const quarterlyDataBody = document.getElementById('quarterlyDataBody');
            quarterlyDataBody.innerHTML = '';
            const quarterlyLabels = [];
            const quarterlyRevenues = [];
            const quarterlyNetIncomes = [];

            quarterly_data.forEach(q => {
                quarterlyLabels.unshift(q.date);
                quarterlyRevenues.unshift(q.revenue);
                quarterlyNetIncomes.unshift(q.net_income);

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${q.date}</td>
                    <td>${safeValue(q.revenue)}</td>
                    <td>${safeValue(q.net_income)}</td>
                    <td>${safeValue(q.diluted_eps)}</td>
                    <td>${safeValue(q.basic_eps)}</td>
                    <td>${safeValue(q.net_profit_margin)}</td>
                `;
                quarterlyDataBody.appendChild(row);
            });


            // Update annual income statements
            const annualDataBody = document.getElementById('annualDataBody');
            annualDataBody.innerHTML = '';
            const annualLabels = [];
            const annualRevenues = [];
            const annualNetIncomes = [];

            annual_data.forEach(a => {
                annualLabels.unshift(a.date);
                annualRevenues.unshift(a.revenue);
                annualNetIncomes.unshift(a.net_income);

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${a.date}</td>
                    <td>${safeValue(a.revenue)}</td>
                    <td>${safeValue(a.net_income)}</td>
                    <td>${safeValue(a.diluted_eps)}</td>
                    <td>${safeValue(a.basic_eps)}</td>
                    <td>${safeValue(a.net_profit_margin)}</td>
                `;
                annualDataBody.appendChild(row);
            });


            // Create Column Chart for Quarterly Data
            const ctxQuarterly = document.getElementById('quarterlyChart').getContext('2d');
            if (window.quarterlyChart instanceof Chart) {
                window.quarterlyChart.destroy();
            }
            window.quarterlyChart = new Chart(ctxQuarterly, {
                type: 'bar',
                data: {
                    labels: quarterlyLabels,
                    datasets: [
                        {
                            label: 'Revenue',
                            data: quarterlyRevenues,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Net Income',
                            data: quarterlyNetIncomes,
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    scales: {
                        x: { beginAtZero: true },
                        y: { beginAtZero: true }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    }
                }
            });


            // Create Column Chart for Annual Data
            const ctxAnnual = document.getElementById('annualChart').getContext('2d');
            if (window.annualChart instanceof Chart) {
                window.annualChart.destroy();
            }
            window.annualChart = new Chart(ctxAnnual, {
                type: 'bar',
                data: {
                    labels: annualLabels,
                    datasets: [
                        {
                            label: 'Revenue',
                            data: annualRevenues,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Net Income',
                            data: annualNetIncomes,
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error fetching stock data:', error);
            console.log(error);
            alert('Failed to fetch stock data. Please try again later.');
        });
});
