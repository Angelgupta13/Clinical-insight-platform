"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/micromark-util-encode@2.0.1";
exports.ids = ["vendor-chunks/micromark-util-encode@2.0.1"];
exports.modules = {

/***/ "(ssr)/./node_modules/.pnpm/micromark-util-encode@2.0.1/node_modules/micromark-util-encode/index.js":
/*!****************************************************************************************************!*\
  !*** ./node_modules/.pnpm/micromark-util-encode@2.0.1/node_modules/micromark-util-encode/index.js ***!
  \****************************************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   encode: () => (/* binding */ encode)\n/* harmony export */ });\nconst characterReferences = {\n    '\"': \"quot\",\n    \"&\": \"amp\",\n    \"<\": \"lt\",\n    \">\": \"gt\"\n};\n/**\n * Encode only the dangerous HTML characters.\n *\n * This ensures that certain characters which have special meaning in HTML are\n * dealt with.\n * Technically, we can skip `>` and `\"` in many cases, but CM includes them.\n *\n * @param {string} value\n *   Value to encode.\n * @returns {string}\n *   Encoded value.\n */ function encode(value) {\n    return value.replace(/[\"&<>]/g, replace);\n    /**\n   * @param {string} value\n   *   Value to replace.\n   * @returns {string}\n   *   Encoded value.\n   */ function replace(value) {\n        return \"&\" + characterReferences[/** @type {keyof typeof characterReferences} */ value] + \";\";\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvLnBucG0vbWljcm9tYXJrLXV0aWwtZW5jb2RlQDIuMC4xL25vZGVfbW9kdWxlcy9taWNyb21hcmstdXRpbC1lbmNvZGUvaW5kZXguanMiLCJtYXBwaW5ncyI6Ijs7OztBQUFBLE1BQU1BLHNCQUFzQjtJQUFDLEtBQUs7SUFBUSxLQUFLO0lBQU8sS0FBSztJQUFNLEtBQUs7QUFBSTtBQUUxRTs7Ozs7Ozs7Ozs7Q0FXQyxHQUNNLFNBQVNDLE9BQU9DLEtBQUs7SUFDMUIsT0FBT0EsTUFBTUMsT0FBTyxDQUFDLFdBQVdBO0lBRWhDOzs7OztHQUtDLEdBQ0QsU0FBU0EsUUFBUUQsS0FBSztRQUNwQixPQUNFLE1BQ0FGLG1CQUFtQixDQUNqQiw2Q0FBNkMsR0FBSUUsTUFDbEQsR0FDRDtJQUVKO0FBQ0YiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jbGluaWNhbC1pbnNpZ2h0LWZyb250ZW5kLy4vbm9kZV9tb2R1bGVzLy5wbnBtL21pY3JvbWFyay11dGlsLWVuY29kZUAyLjAuMS9ub2RlX21vZHVsZXMvbWljcm9tYXJrLXV0aWwtZW5jb2RlL2luZGV4LmpzPzE1NWIiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgY2hhcmFjdGVyUmVmZXJlbmNlcyA9IHsnXCInOiAncXVvdCcsICcmJzogJ2FtcCcsICc8JzogJ2x0JywgJz4nOiAnZ3QnfVxuXG4vKipcbiAqIEVuY29kZSBvbmx5IHRoZSBkYW5nZXJvdXMgSFRNTCBjaGFyYWN0ZXJzLlxuICpcbiAqIFRoaXMgZW5zdXJlcyB0aGF0IGNlcnRhaW4gY2hhcmFjdGVycyB3aGljaCBoYXZlIHNwZWNpYWwgbWVhbmluZyBpbiBIVE1MIGFyZVxuICogZGVhbHQgd2l0aC5cbiAqIFRlY2huaWNhbGx5LCB3ZSBjYW4gc2tpcCBgPmAgYW5kIGBcImAgaW4gbWFueSBjYXNlcywgYnV0IENNIGluY2x1ZGVzIHRoZW0uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gKiAgIFZhbHVlIHRvIGVuY29kZS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKiAgIEVuY29kZWQgdmFsdWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGUodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1tcIiY8Pl0vZywgcmVwbGFjZSlcblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gICAqICAgVmFsdWUgdG8gcmVwbGFjZS5cbiAgICogQHJldHVybnMge3N0cmluZ31cbiAgICogICBFbmNvZGVkIHZhbHVlLlxuICAgKi9cbiAgZnVuY3Rpb24gcmVwbGFjZSh2YWx1ZSkge1xuICAgIHJldHVybiAoXG4gICAgICAnJicgK1xuICAgICAgY2hhcmFjdGVyUmVmZXJlbmNlc1tcbiAgICAgICAgLyoqIEB0eXBlIHtrZXlvZiB0eXBlb2YgY2hhcmFjdGVyUmVmZXJlbmNlc30gKi8gKHZhbHVlKVxuICAgICAgXSArXG4gICAgICAnOydcbiAgICApXG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJjaGFyYWN0ZXJSZWZlcmVuY2VzIiwiZW5jb2RlIiwidmFsdWUiLCJyZXBsYWNlIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/.pnpm/micromark-util-encode@2.0.1/node_modules/micromark-util-encode/index.js\n");

/***/ })

};
;