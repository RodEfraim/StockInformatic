from flask import Flask, render_template, jsonify, request
import yfinance as yf
import numpy as np
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)


# Helper function to replace NaN values
def safe_value(value):
    if isinstance(value, (int, float)) and np.isnan(value):
        return 'N/A'
    return value if value is not None else 'N/A'


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

        # trailing pe ratio = current share price / earnings-per-share (EPS) over the past 12 months.
        # aka
        # trailing pe ratio = current share price / 12-month trailing EPS

        # forward pe ratio = current share price / earnings-per-share (EPS) over the projected next 12 months.
        # aka
        # forward pe ratio = current share price / 12-month forward EPS estimate
        # https://seekingalpha.com/article/4430117-trailing-vs-forward-pe-ratio has good info on PE ratios.
        stock_info = {
            "current_price": safe_value(stock.info.get('currentPrice')),
            "market_cap": safe_value(stock.info.get('marketCap')),
            "pe_ratio": safe_value(stock.info.get('forwardPE')),
            "trailing_pe_ratio": safe_value(stock.info.get('trailingPE')),
            "forward_pe_ratio": safe_value(stock.info.get('forwardPE')),
            "dividend_yield": safe_value(stock.info.get('dividendYield')),
            "52_week_high": safe_value(stock.info.get('fiftyTwoWeekHigh')),
            "52_week_low": safe_value(stock.info.get('fiftyTwoWeekLow')),
        }

        # TODO: It seems like it does not let us fetch more than 5 quarterly results...
        # Yahoo Finance generally provides the past 4 years of reported annual
        # data and the last 5 quarters of quarterly data...

        # Fetch quarterly income statements
        quarterly_income_statements = stock.quarterly_financials.T.head(5)
        quarterly_data = []
        for index, row in quarterly_income_statements.iterrows():
            logging.debug("index.strftime('%Y-%m-%d'): " + index.strftime('%Y-%m-%d'))

            quarterly_data.append({
                "date": index.strftime('%Y-%m-%d'),
                "revenue": safe_value(row.get('Total Revenue')),
                "net_income": safe_value(row.get('Net Income')),
                "diluted_eps": safe_value(row.get('Diluted EPS')),
                "basic_eps": safe_value(row.get('Basic EPS')),  # Assuming Basic EPS is available
                "net_profit_margin": safe_value(row.get('Net Profit Margin'))
            })

        # Fetch annual income statements
        annual_income_statements = stock.financials.T.head(4)
        annual_data = []
        for index, row in annual_income_statements.iterrows():
            annual_data.append({
                "date": index.strftime('%Y-%m-%d'),
                "revenue": safe_value(row.get('Total Revenue')),
                "net_income": safe_value(row.get('Net Income')),
                "diluted_eps": safe_value(row.get('Diluted EPS')),
                "basic_eps": safe_value(row.get('Basic EPS')),  # Assuming Basic EPS is available
                "net_profit_margin": safe_value(row.get('Net Profit Margin'))
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