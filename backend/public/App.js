"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// packages
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const spotify_web_api_node_1 = __importDefault(require("spotify-web-api-node"));
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cors_1 = __importDefault(require("cors"));
// types/interfaces/components
const scopes_1 = require("./components/scopes");
// init server
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.listen(3000, 'localhost', () => {
    console.log("It's alive on http://localhost:3000");
});
// middleware
app.use((0, morgan_1.default)('dev'));
// init spotify access
var config = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, '..', 'json', 'access.json'), 'utf8'));
const state = crypto_1.default.randomBytes(16).toString('hex');
;
let creds = {
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
};
let spotifyApi = new spotify_web_api_node_1.default(creds);
// routes
//// gets authorization URL for frontend to open
app.get('/getURL', (req, res) => {
    let obj = {};
    obj = Object.assign({ 'url': spotifyApi.createAuthorizeURL(scopes_1.scopes, state) }, obj);
    res.send(obj);
});
//// callback route
app.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;
    // parse error
    if (error) {
        console.error('Callback Error:', error);
        res.send(`Callback Error: ${error}`);
        return;
    }
    ;
    // output obj
    let obj = {
        'request': req.query,
        'error': error,
        'state': state,
        'code': code
    };
    if (typeof code === 'string') {
        spotifyApi.authorizationCodeGrant(code)
            .then(data => {
            const access_token = data.body['access_token'];
            const refresh_token = data.body['refresh_token'];
            const expires_in = data.body['expires_in'];
            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);
            obj = Object.assign({ 'access_token': access_token }, obj);
            obj = Object.assign({ 'refresh_token': refresh_token }, obj);
            obj = Object.assign({ 'expires_in': expires_in }, obj);
            obj = Object.assign({ 'data': data }, obj);
            // refreshes token, CREATE NEW ROUTE TO HANDLE
            //   setInterval(async () => {
            //     const data = await spotifyApi.refreshAccessToken();
            //     const access_token = data.body['access_token'];
            //     console.log('The access token has been refreshed!');
            //     console.log('access_token:', access_token);
            //     spotifyApi.setAccessToken(access_token);
            //     res.send(obj);
            //   }, expires_in / 2 * 1000);
            const query = '?access_token=' + access_token + '&refresh_token=' + refresh_token;
            res.redirect('http://localhost:8080/' + query);
        })
            .catch(error => {
            obj = Object.assign({ 'Error getting Tokens': error }, obj);
            res.send(obj);
        });
    }
    ;
});
//// refresh user token
app.get('/refresh', (req, res) => {
});
//// get user info
app.get('/me', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const firstRes = res;
    if (req.query.access_token) {
        try {
            const params = {
                access_token: req.query.access_token,
            };
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + params.access_token,
            };
            const url = 'https://api.spotify.com/v1/me';
            yield fetch(url, { headers: headers })
                .then(res => res.json())
                .then(data => firstRes.send(data))
                .catch(err => res.send(err))
                .catch(err => res.send(err));
        }
        catch (err) {
            res.send(err);
        }
    }
}));
//// get top x route
app.get('/gettopx', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const firstRes = res;
    if (req.query.access_token && req.query.request_type && req.query.time_range && req.query.limit && req.query.offset) {
        try {
            const params = {
                access_token: req.query.access_token,
                request_type: req.query.request_type,
                time_range: req.query.time_range,
                limit: req.query.limit,
                offset: req.query.offset,
            };
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + params.access_token,
            };
            const url = 'https://api.spotify.com/v1/me/top/' + params.request_type + '?time_range=' + params.time_range + '&limit=' + params.limit + '&offset=' + params.offset;
            yield fetch(url, { headers: headers })
                .then(res => res.json())
                .then(data => firstRes.send(data))
                .catch(err => res.send(err))
                .catch(err => res.send(err));
        }
        catch (err) {
            res.send(err);
        }
    }
    else {
        res.send({ "code": "400", "error": "Invalid Request" });
    }
}));