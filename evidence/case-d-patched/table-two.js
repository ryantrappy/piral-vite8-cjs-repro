//@pilet v:2(rolluppr_tabletwo,{})
System.register(["react", "react-table"], function(_export, _context) {
	"use strict";
	var m, useMemo, useTable, __commonJSMin, require_builtin_esm_external_require_react, require_react_jsx_runtime_production_min, require_jsx_runtime, import_jsx_runtime;
	function TableTwo() {
		const columns = useMemo(() => [{
			Header: "Product",
			accessor: "product"
		}, {
			Header: "Price",
			accessor: "price"
		}], []);
		const data = useMemo(() => [
			{
				product: "Keyboard",
				price: 99
			},
			{
				product: "Mouse",
				price: 49
			},
			{
				product: "Monitor",
				price: 399
			}
		], []);
		const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
			columns,
			data
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Table Two — Products" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			...getTableProps(),
			border: 1,
			cellPadding: 6,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: headerGroups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
				...group.getHeaderGroupProps(),
				children: group.headers.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					...column.getHeaderProps(),
					children: column.render("Header")
				}))
			})) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
				...getTableBodyProps(),
				children: rows.map((row) => {
					prepareRow(row);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
						...row.getRowProps(),
						children: row.cells.map((cell) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							...cell.getCellProps(),
							children: cell.render("Cell")
						}))
					});
				})
			})]
		})] });
	}
	// src/index.tsx
	function setup(api) {
		console.log("[table-two] setup called");
		api.registerExtension("table-two", () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableTwo, {}));
	}
	_export("setup", setup);
	return {
		setters: [function(_react) {
			m = _react;
			useMemo = _react.useMemo;
		}, function(_reactTable) {
			useTable = _reactTable.useTable;
		}],
		execute: function() {
			// \0rolldown/runtime.js
			__commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod, mod.exports), cb = null), mod.exports);
			require_builtin_esm_external_require_react = /* @__PURE__ */ __commonJSMin((exports, module) => {
				module.exports = Object.prototype.hasOwnProperty.call(m, "module.exports") ? m["module.exports"] : { ...m };
			});
			/**
			* @license React
			* react-jsx-runtime.production.min.js
			*
			* Copyright (c) Facebook, Inc. and its affiliates.
			*
			* This source code is licensed under the MIT license found in the
			* LICENSE file in the root directory of this source tree.
			*/
			require_react_jsx_runtime_production_min = /* @__PURE__ */ __commonJSMin((exports) => {
				var f = require_builtin_esm_external_require_react();
				var k = Symbol.for("react.element");
				var m = Object.prototype.hasOwnProperty;
				var n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner;
				var p = {
					key: !0,
					ref: !0,
					__self: !0,
					__source: !0
				};
				function q(c, a, g) {
					var b, d = {}, e = null, h = null;
					void 0 !== g && (e = "" + g);
					void 0 !== a.key && (e = "" + a.key);
					void 0 !== a.ref && (h = a.ref);
					for (b in a) m.call(a, b) && !p.hasOwnProperty(b) && (d[b] = a[b]);
					if (c && c.defaultProps) for (b in a = c.defaultProps, a) void 0 === d[b] && (d[b] = a[b]);
					return {
						$$typeof: k,
						type: c,
						key: e,
						ref: h,
						props: d,
						_owner: n.current
					};
				}
				exports.jsx = q;
				exports.jsxs = q;
			});
			require_jsx_runtime = /* @__PURE__ */ __commonJSMin((exports, module) => {
				module.exports = require_react_jsx_runtime_production_min();
			});
			import_jsx_runtime = require_jsx_runtime();
			console.log("[table-two] module evaluated");
		}
	};
});

//# sourceMappingURL=index.js.map