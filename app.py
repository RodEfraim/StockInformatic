from flask import Flask, render_template, jsonify, request
import yfinance as yf
import pandas as pd
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)


def fetch_stock_data(symbol, period):
    logging.debug("***** Entered fetch_stock_data *****")
    logging.debug(f"Fetching data for symbol: {symbol} with period: {period}")
    try:
        stock = yf.Ticker(symbol)
        data = stock.history(period=period)
        if data.empty:
            logging.warning(f"No data found for symbol: {symbol} with period: {period}")
            return {}, [], [], []
        data.reset_index(inplace=True)
        data['Date'] = data['Date'].astype(str)

        # trailing pe ratio = current share price / earnings per share over past 12 months.
        # https://seekingalpha.com/article/4430117-trailing-vs-forward-pe-ratio has good info on PE ratios.
        stock_info = {
            "current_price": stock.info.get('currentPrice', 'N/A'),
            "market_cap": stock.info.get('marketCap', 'N/A'),
            "trailing_pe_ratio": stock.info.get('trailingPE', 'N/A'),
            "forward_pe_ratio": stock.info.get('forwardPE', 'N/A'),
            "dividend_yield": stock.info.get('dividendYield', 'N/A'),
            "52_week_high": stock.info.get('fiftyTwoWeekHigh', 'N/A'),
            "52_week_low": stock.info.get('fiftyTwoWeekLow', 'N/A'),
        }

        # Fetch quarterly income statements
        # TODO: It seems like it does let us fetch more than 5 quarterly results...
        # Yahoo Finance generally provides the past 4 years of reported annual
        # data and the last 5 quarters of quarterly data...

        # TODO: Make a column graph: https://blog.hubspot.com/marketing/types-of-graphs-for-data-visualization
        quarterly_income_statements = stock.quarterly_financials.T.head(5)
        quarterly_data = []
        for index, row in quarterly_income_statements.iterrows():
            quarterly_data.append({
                "date": index.strftime('%Y-%m-%d'),
                "revenue": row.get('Total Revenue', 'N/A'),
                "net_income": row.get('Net Income', 'N/A'),
                "diluted_eps": row.get('Diluted EPS', 'N/A'),
                "net_profit_margin": row.get('Net Profit Margin', 'N/A')
            })

        # Fetch annual income statements
        annual_income_statements = stock.financials.T.head(4)
        annual_data = []
        for index, row in annual_income_statements.iterrows():
            annual_data.append({
                "date": index.strftime('%Y-%m-%d'),
                "revenue": row.get('Total Revenue', 'N/A'),
                "net_income": row.get('Net Income', 'N/A'),
                "diluted_eps": row.get('Diluted EPS', 'N/A'),
                "net_profit_margin": row.get('Net Profit Margin', 'N/A')
            })

        return stock_info, data.to_dict(orient='records'), quarterly_data, annual_data
    except Exception as e:
        logging.error(f"Error fetching data for symbol: {symbol} with period: {period}: {e}")
        return {}, [], [], []


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/stock/<symbol>')
def get_stock_data(symbol):
    logging.debug("******* Entered get_stock_data *******")
    period = request.args.get('period', '1mo')
    logging.debug(f"Symbol: {symbol}")
    logging.debug(f"Period: {period}")
    period = request.args.get('period', '1mo')
    stock_info, data, quarterly_data, annual_data = fetch_stock_data(symbol, period)
    return jsonify({"stock_info": stock_info, "data": data, "quarterly_data": quarterly_data, "annual_data": annual_data})


if __name__ == '__main__':
    app.run(debug=True)