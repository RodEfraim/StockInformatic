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
            return {}, []
        data.reset_index(inplace=True)
        data['Date'] = data['Date'].astype(str)
        stock_info = {
            "current_price": stock.info.get('currentPrice', 'N/A'),
            "market_cap": stock.info.get('marketCap', 'N/A'),
            "trailing_pe_ratio": stock.info.get('trailingPE', 'N/A'),
            "forward_pe_ratio": stock.info.get('forwardPE', 'N/A'),
            "dividend_yield": stock.info.get('dividendYield', 'N/A'),
            "52_week_high": stock.info.get('fiftyTwoWeekHigh', 'N/A'),
            "52_week_low": stock.info.get('fiftyTwoWeekLow', 'N/A'),
        }
        # return data.to_dict(orient='records')
        return stock_info, data.to_dict(orient='records')
    except Exception as e:
        logging.error(f"Error fetching data for symbol: {symbol} with period: {period}: {e}")
        return []


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/stock/<symbol>')
def get_stock_data(symbol):
    logging.debug("******* Entered get_stock_data *******")
    period = request.args.get('period', '1mo')
    logging.debug(f"Symbol: {symbol}")
    logging.debug(f"Period: {period}")
    stock_info, data = fetch_stock_data(symbol, period)
    return jsonify({"stock_info": stock_info, "data": data})
    # logging.debug("***** Entered get_stock_data *****")
    # period = request.args.get('period', '1mo')
    # logging.debug(f"Symbol: {symbol}")
    # logging.debug(f"Period: {period}")
    # data = fetch_stock_data(symbol, period)
    # return jsonify(data)


if __name__ == '__main__':
    app.run(debug=True)