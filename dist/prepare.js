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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.prepare = void 0;
var poss = require("poss");
var inquirer = require("inquirer");
var store_1 = require("./store");
var errors_1 = require("./errors");
var api_1 = require("./api");
var child_process_1 = require("child_process");
function prepare(projectToken, userToken) {
    return __awaiter(this, void 0, void 0, function () {
        var commandOutput, defaultBranchName, getTags, _a, bErr, tagsRes, tags, plusBranchTag;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: 
                // Checks the project token
                return [4 /*yield*/, (0, api_1.checkProject)(userToken, projectToken)
                    // Gets tags
                ];
                case 1:
                    // Checks the project token
                    _b.sent();
                    commandOutput = (0, child_process_1.execSync)('git rev-parse --abbrev-ref HEAD');
                    defaultBranchName = commandOutput.toString().trim();
                    getTags = { name: "tags",
                        transformer: function (a, b) {
                            return "#".concat(defaultBranchName, " ").concat(a);
                        },
                        message: "Tags", description: "Team members could find or filter demo items by these entered tags" };
                    return [4 /*yield*/, poss(inquirer.prompt([getTags]))];
                case 2:
                    _a = _b.sent(), bErr = _a[0], tagsRes = _a[1];
                    if (bErr) {
                        return [2 /*return*/, (0, errors_1.handleError)("Getting tags encountred with error")];
                    }
                    tags = tagsRes.tags;
                    plusBranchTag = "#".concat(defaultBranchName, " ").concat(tags);
                    (0, store_1.storeData)({ userToken: userToken, tags: plusBranchTag, projectToken: projectToken });
                    return [2 /*return*/];
            }
        });
    });
}
exports.prepare = prepare;
