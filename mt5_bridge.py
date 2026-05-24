"""
MT5 Bridge Service for Node.js/TypeScript backend.
Receives trade signals from the backend and executes market orders on MT5.
"""

import os
import re
import sys
import time
from datetime import datetime
from typing import Any

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

try:
    from flask import Flask, jsonify, request
except ImportError:
    print('Missing dependency: flask. Install with `pip install flask python-dotenv MetaTrader5`.')
    sys.exit(1)

try:
    import MetaTrader5 as mt5
except ImportError:
    print('Missing dependency: MetaTrader5. Install with `pip install MetaTrader5`.')
    sys.exit(1)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOTENV_FILE = os.path.join(BASE_DIR, '.env.local')

if load_dotenv:
    load_dotenv(DOTENV_FILE)

MT5_LOGIN = os.getenv('MT5_LOGIN')
MT5_PASSWORD = os.getenv('MT5_PASSWORD')
MT5_SERVER = os.getenv('MT5_SERVER')
MT5_PORT = int(os.getenv('MT5_BRIDGE_PORT', '5001'))
MT5_MAX_LOT = float(os.getenv('MT5_MAX_LOT', '0.1'))

if not MT5_LOGIN or not MT5_PASSWORD or not MT5_SERVER:
    print('Missing MT5 credentials in environment. Set MT5_LOGIN, MT5_PASSWORD, MT5_SERVER.')
    sys.exit(1)

app = Flask(__name__)

VALID_SYMBOL_PATTERN = r'^[A-Z0-9\.\-_]{3,12}$'


def init_mt5() -> None:
    if not mt5.initialize(login=int(MT5_LOGIN), password=MT5_PASSWORD, server=MT5_SERVER):
        error = mt5.last_error()
        print(f'❌ MT5 initialization failed: {error}')
        sys.exit(1)

    account_info = mt5.account_info()
    if account_info is None:
        print('❌ Failed to fetch MT5 account info after login.')
        sys.exit(1)

    print('✅ Connected to MT5')
    print(f'   Account: {account_info.login}')
    print(f'   Balance: {account_info.balance:,.2f}')
    print(f'   Equity: {account_info.equity:,.2f}')
    print(f'   Server: {MT5_SERVER}')


def validate_trade_command(command: dict[str, Any]) -> tuple[bool, list[str], dict[str, Any]]:
    errors = []
    action = str(command.get('action', '')).upper()
    symbol = str(command.get('symbol', '')).strip().upper()
    lot = command.get('lot')
    stop_loss = command.get('stopLoss')
    take_profit = command.get('takeProfit')

    if action not in ('BUY', 'SELL'):
        errors.append('Invalid action. Must be BUY or SELL.')

    if not symbol or not re.match(VALID_SYMBOL_PATTERN, symbol):
        errors.append('Invalid symbol. Use uppercase ticker like XAUUSD or EURUSD.')

    try:
        lot = float(lot)
        if lot <= 0:
            raise ValueError
    except Exception:
        errors.append('Invalid lot size. Must be a positive number.')

    if isinstance(lot, float) and lot > MT5_MAX_LOT:
        errors.append(f'Lot size exceeds max allowed ({MT5_MAX_LOT}).')

    try:
        stop_loss = float(stop_loss)
    except Exception:
        errors.append('Invalid stopLoss. Must be a number.')

    try:
        take_profit = float(take_profit)
    except Exception:
        errors.append('Invalid takeProfit. Must be a number.')

    return (
        len(errors) == 0,
        errors,
        {
            'action': action,
            'symbol': symbol,
            'lot': lot,
            'stopLoss': stop_loss,
            'takeProfit': take_profit,
        }
    )


def execute_mt5_order(command: dict[str, Any]) -> dict[str, Any]:
    symbol = command['symbol']
    action = command['action']
    volume = command['lot']
    stop_loss = command['stopLoss']
    take_profit = command['takeProfit']

    symbol_info = mt5.symbol_info(symbol)
    if symbol_info is None:
        raise RuntimeError(f'Symbol not found in MT5: {symbol}')

    if not symbol_info.visible:
        if not mt5.symbol_select(symbol, True):
            raise RuntimeError(f'Failed to select symbol: {symbol}')

    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        raise RuntimeError(f'Unable to get tick data for symbol: {symbol}')

    price = tick.ask if action == 'BUY' else tick.bid
    order_type = mt5.ORDER_TYPE_BUY if action == 'BUY' else mt5.ORDER_TYPE_SELL

    request = {
        'action': mt5.TRADE_ACTION_DEAL,
        'symbol': symbol,
        'volume': volume,
        'type': order_type,
        'price': price,
        'sl': stop_loss,
        'tp': take_profit,
        'deviation': 20,
        'magic': 234000,
        'type_filling': mt5.ORDER_FILLING_IOC,
        'type_time': mt5.ORDER_TIME_GTC,
    }

    result = mt5.order_send(request)
    if result is None:
        raise RuntimeError('MT5 order_send returned no result.')

    if result.retcode != mt5.TRADE_RETCODE_DONE:
        raise RuntimeError(f'MT5 order failed: retcode={result.retcode}, comment={result.comment}')

    return {
        'status': 'success',
        'ticket': int(result.order),
        'symbol': symbol,
        'action': action,
        'volume': volume,
        'price': float(result.price),
        'stopLoss': stop_loss,
        'takeProfit': take_profit,
        'comment': result.comment,
        'timestamp': datetime.utcnow().isoformat(),
    }


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'MT5 bridge service is running',
        'account': MT5_LOGIN,
        'server': MT5_SERVER,
        'timestamp': datetime.utcnow().isoformat(),
    })


@app.route('/account', methods=['GET'])
def account_info():
    account = mt5.account_info()
    if account is None:
        return jsonify({'status': 'error', 'message': 'Failed to fetch MT5 account info'}), 500

    account_data = account._asdict()
    return jsonify({
        'status': 'ok',
        'account': {
            'login': account_data.get('login'),
            'balance': float(account_data.get('balance', 0.0)),
            'equity': float(account_data.get('equity', 0.0)),
            'margin': float(account_data.get('margin', 0.0)),
            'margin_free': float(account_data.get('margin_free', 0.0)),
            'currency': account_data.get('currency'),
            'server': account_data.get('server'),
            'leverage': account_data.get('leverage'),
            'name': account_data.get('name'),
        },
        'timestamp': datetime.utcnow().isoformat(),
    })


@app.route('/execute', methods=['POST'])
def execute_command():
    payload = request.get_json(force=True, silent=True)
    if not payload:
        return jsonify({'status': 'error', 'message': 'Invalid JSON payload.'}), 400

    valid, errors, cleaned = validate_trade_command(payload)
    if not valid:
        return jsonify({'status': 'error', 'message': 'Validation failed.', 'errors': errors}), 400

    print('[MT5 BRIDGE] Received trade command:', cleaned)

    try:
        result = execute_mt5_order(cleaned)
        print('[MT5 BRIDGE] Order executed successfully:', result)
        return jsonify(result)
    except Exception as ex:
        print('[MT5 BRIDGE] Order execution failed:', str(ex))
        return jsonify({'status': 'error', 'message': str(ex)}), 500


def run_server():
    print('=== Khanyisa MT5 Bridge Service ===')
    print(f'Listening on http://0.0.0.0:{MT5_PORT}')
    print('MT5 Login:', MT5_LOGIN)
    print('MT5 Server:', MT5_SERVER)
    init_mt5()
    app.run(host='0.0.0.0', port=MT5_PORT, debug=False)


if __name__ == '__main__':
    try:
        run_server()
    except KeyboardInterrupt:
        print('\nStopping MT5 bridge...')
    finally:
        mt5.shutdown()
