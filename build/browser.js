/* jshint browser: true, undef: true */
if (typeof window === "undefined") throw new Error("No window defined.");

/* jshint strict: true, undef: true */
/* globals is_spec_env, window, _, is_empty, function_to_name, spec_dom */
// Specification function:
// Accepts:
//   str_or_func : The function the spec is about.
function spec_new(str_or_func) {
    "use strict";
    if (!is_spec_env()) return false;
    // === Is there a specific spec to run?
    if (typeof window !== "undefined") {
        var href = window.location.href;
        var target = _.trim(href.split("?").pop() || "");
        if (!is_empty(target) && target !== href && target !== function_to_name(str_or_func)) return false;
        // === Reset DOM:
        spec_dom("reset");
    }
    return true;
}

/* jshint strict: true, undef: true */
/* globals to_string, length, setTimeout, be, is_specs */
function spec_next(specs) {
    "use strict";
    be(is_specs, specs);
    if (specs.i === "init") {
        specs.i = 0;
    } else {
        if (specs.dones[specs.i] !== true) throw new Error("Spec did not finish: " + to_string(specs.list[specs.i]));
        specs.i = specs.i + 1;
    }
    var i = specs.i;
    var list = specs.list;
    var func = list[i];
    // === Are all specs finished?
    if (!func && i >= length(specs.list)) {
        specs.total = i;
        if (specs.total !== specs.list.length) throw new Error("Not all specs finished: " + to_string(specs.total) + " !== " + to_string(specs.list.length));
        specs.on_finish(specs);
        return length(specs.list);
    }
    // === Function was found?
    if (!func) {
        throw new Error("Spec not found: " + to_string(i));
    }
    // === Async?
    if (length(func) === 1) {
        setTimeout(function() {
            if (!specs.dones[i]) throw new Error("Spec did not finish in time: " + to_string(func));
        }, 2500);
        func(function() {
            specs.dones[i] = true;
            spec_next(specs);
        });
        return false;
    }
    // === Regular spec, non-asyc?
    if (length(func) === 0) {
        func();
        specs.dones[i] = true;
        return spec_next(specs);
    }
    throw new Error("Function has invalid arguments: " + to_string(func));
}

/* jshint strict: true, undef: true */
/* globals is_spec_env, log, spec, is_empty, spec_next, to_string */
// === Arguments:
// spec_run()
// spec_run(function (msg) { log('Finished specs: ' + msg.total); })
//
// === Used by other functions to continue running specs:
// spec_run({
//    list: [],
//    i:"init"|0|positive,
//    on_finish: my_callback
// });
//
function spec_run() {
    "use strict";
    if (!is_spec_env()) return false;
    var on_fin = arguments[0] || function(msg) {
        log("      ======================================");
        log("      Specs Finish: " + to_string(msg.total) + " tests");
        log("      ======================================");
    };
    if (!spec.specs || is_empty(spec.specs)) throw new Error("No specs found.");
    return spec_next({
        i: "init",
        list: spec.specs.slice(0),
        dones: {},
        on_finish: on_fin,
        total: 0
    });
}

/* jshint strict: true, undef: true */
/* globals $, process */
// Specification function:
function is_spec_env() {
    "use strict";
    return typeof window !== "undefined" && $("#Spec_Stage").length === 1 || typeof process !== "undefined" && process.argv[2] === "test";
}

/* jshint strict: true, undef: true */
/* globals _, to_string, spec_push, to_function_string, to_match_string, log, spec_new */
// Specification function:
function spec_throws(f, args, expect) {
    "use strict";
    if (!spec_new(f)) return false;
    if (!_.isFunction(f)) throw new Error("Invalid value for func: " + to_string(f));
    if (!_.isArray(args)) throw new Error("Invalid value for args: " + to_string(args));
    if (!_.isString(expect)) throw new Error("Invalid valie for expect: " + to_string(expect));
    spec_push(function() {
        var actual, err;
        var sig = to_function_string(f, args);
        try {
            f.apply(null, args);
        } catch (e) {
            err = e;
            actual = e.message;
        }
        var msg = to_match_string(actual, expect);
        if (!actual) throw new Error("!!! Failed to throw error: " + sig + " -> " + expect);
        if (_.isEqual(actual, expect)) {
            log("=== Passed: " + sig + " -> " + expect);
            return true;
        }
        log(err);
        throw new Error("Error message does not match: " + to_string(actual) + " !== " + to_string(expect));
    });
}

/* jshint strict: true, undef: true */
/* globals _, length, to_string, function_to_name, log, spec_new, spec_push, to_match_string */
// Specification function:
function spec_returns(expect, f) {
    "use strict";
    if (!spec_new(f)) return false;
    if (!_.isFunction(f)) throw new Error("Invalid value for func: " + to_string(f));
    if (length(f) === 0) {
        spec_push(function() {
            var sig = function_to_name(f);
            var actual = f();
            var msg = to_match_string(actual, expect);
            if (!_.isEqual(actual, expect)) throw new Error("!!! Failed: " + sig + " -> " + msg);
            log("=== Passed: " + sig + " -> " + msg);
            return true;
        });
        return;
    }
    // if f.length === 0
    // === Async func:
    spec_push(function(fin) {
        var sig = function_to_name(f);
        f(function(actual) {
            var msg = to_match_string(actual, expect);
            if (!_.isEqual(actual, expect)) throw new Error("!!! Failed: " + sig + " -> " + msg);
            log("=== Passed: " + sig + " -> " + msg);
            fin();
            return true;
        });
    });
}

/* jshint strict: true, undef: true */
/* globals be, is, not, is_empty, or, is_plain_object, is_positive */
function is_specs(specs) {
    "use strict";
    var is_valid_specs_i = or(is("init"), is(0), is_positive);
    be(is_plain_object, specs);
    be(not(is_empty), specs.list);
    be(is_valid_specs_i, specs.i);
    be(is_plain_object, specs.dones);
    return true;
}

/* jshint strict: true, undef: true */
/* globals $, to_string */
// Specification function:
// Accepts:
//   string : 'reset'  => Reset dom for next test.
function spec_dom(cmd) {
    "use strict";
    switch (cmd) {
      case "reset":
        var stage = $("#Spec_Stage");
        if (stage.length === 0) $("body").prepend('<div id="Spec_Stage"></div>'); else stage.empty();
        break;

      default:
        if (arguments.length !== 0) throw new Error("Unknown value: " + to_string(arguments));
    }
    // === switch cmd
    return $("#Spec_Stage");
}

/* jshint strict: true, undef: true */
/* globals _, to_match_string, log, spec_push, to_string, spec_new, to_function_string */
// Specification function:
function spec(f, args, expect) {
    "use strict";
    if (!spec_new(f)) return false;
    if (!_.isFunction(f)) throw new Error("Invalid value for func: " + to_string(f));
    if (arguments.length !== 3) throw new Error("arguments.length invalid for spec: " + to_string(arguments.length));
    spec_push(function() {
        var sig = to_function_string(f, args);
        var actual = f.apply(null, args);
        var msg = to_match_string(actual, expect);
        if (actual !== expect && !_.isEqual(actual, expect)) throw new Error("!!! Failed: " + sig + " -> " + msg);
        log("=== Passed: " + sig + " -> " + msg);
        return true;
    });
}

/* jshint strict: true, undef: true */
/* globals is_spec_env, spec */
// Specification function:
//   Accepts:
//     f - function
//   Runs function (ie test) with all other tests
//   when spec_run is called.
function spec_push(f) {
    "use strict";
    if (!is_spec_env()) return false;
    if (!spec.specs) spec.specs = [];
    spec.specs = [].concat(spec.specs).concat([ f ]);
    return true;
}

/* jshint strict: true, undef: true */
/* globals to_string, setTimeout */
function wait_max(seconds, func) {
    "use strict";
    var ms = seconds * 1e3;
    var total = 0;
    var interval = 100;
    function reloop() {
        total = total + interval;
        if (func()) return true;
        if (total > ms) throw new Error("Timeout exceeded: " + to_string(func)); else setTimeout(reloop, interval);
    }
    setTimeout(reloop, interval);
}

/* jshint strict: true, undef: true */
function to_arg(val) {
    "use strict";
    return function(f) {
        return f(val);
    };
}

/* jshint strict: true, undef: true */
/* globals spec, is_string */
spec(is_function_name, [ "is_function" ], true);

spec(is_function_name, [ "none none" ], false);

spec(is_function_name, [ is_function_name ], false);

function is_function_name(v) {
    "use strict";
    return is_string(v) && typeof v === "function";
}

/* jshint strict: true, undef: true */
/* globals arguments_are, is_positive, is_function */
function do_it(num, func) {
    "use strict";
    arguments_are(arguments, is_positive, is_function);
    for (var i = 0; i < num; i++) {
        func();
    }
    return true;
}

/* jshint strict: true, undef: true */
/* globals spec, to_string, or, is_null, is_undefined */
spec(is_nothing, [ null ], true);

spec(is_nothing, [ undefined ], true);

spec(is_nothing, [ [] ], false);

spec(is_nothing, [ {} ], false);

spec(is_nothing, [ {
    a: "c"
} ], false);

function is_nothing(v) {
    "use strict";
    if (arguments.length !== 1) throw new Error("arguments.length !== 1: " + to_string(v));
    return or(is_null, is_undefined)(v);
}

/* jshint strict: true, undef: true */
function is_true(v) {
    "use strict";
    return v === true;
}

/* jshint strict: true, undef: true */
/* globals _, length */
function and(_funcs) {
    "use strict";
    var funcs = _.toArray(arguments);
    return function(v) {
        for (var i = 0; i < length(funcs); i++) {
            if (!funcs[i](v)) return false;
        }
        return true;
    };
}

/* jshint strict: true, undef: true */
/* globals spec, return_arguments, spec_throws, _, to_string */
spec(is_empty, [ [] ], true);

spec(is_empty, [ {} ], true);

spec(is_empty, [ "" ], true);

spec(is_empty, [ {
    a: "c"
} ], false);

spec(is_empty, [ [ 1 ] ], false);

spec(is_empty, [ "a" ], false);

spec(is_empty, [ return_arguments() ], true);

spec(is_empty, [ return_arguments(1, 2, 3) ], false);

spec_throws(is_empty, [ null ], "invalid value for is_empty: null");

function is_empty(v) {
    "use strict";
    if (arguments.length !== 1) throw new Error("arguments.length !== 1: " + to_string(v));
    var v_type = typeof v;
    if (v_type === "null" || v_type === "undefined") throw new Error("null and undefined not allowed.");
    if (_.isPlainObject(v)) return _.keys(v).length === 0;
    var l = v.length;
    if (!_.isFinite(l)) throw new Error("!!! Invalid .length property.");
    return l === 0;
}

/* jshint strict: true, undef: true */
/* globals be, is_enumerable, is_function, eachs */
function each_x(coll, f) {
    "use strict";
    be(is_enumerable, coll);
    be(is_function, f);
    return eachs(coll, function(_i, x) {
        return f(x);
    });
}

/* jshint strict: true, undef: true */
/* globals length */
function to_default(valid) {
    "use strict";
    if (length(arguments) === 2) {
        var v = arguments[1];
        if (v === null || v === undefined) return valid;
        return v;
    }
    return function(v) {
        return to_default(valid, v);
    };
}

/* jshint strict: true, undef: true */
function is_num(v) {
    "use strict";
    return typeof v === "number" && isFinite(v);
}

/* jshint strict: true, undef: true */
/* globals set_function_string_name */
function has_property_of(name, type) {
    "use strict";
    var f = function has_property_of(o) {
        return typeof o[name] === type;
    };
    return set_function_string_name(f, arguments);
}

/* jshint strict: true, undef: true */
/* globals _, spec, spec_throws, reduce, be, is_string, not, is_empty */
spec(key_to_bool, [ "time", {
    time: "morning"
} ], true);

// it 'returns true if key is "truthy"'
spec(key_to_bool, [ "!time", {
    time: false
} ], true);

// it 'returns true if: !key , key is !truthy'
spec(key_to_bool, [ "!first.second.third", {
    first: {
        second: {
            third: true
        }
    }
} ], true);

// it 'handles nested keys'
spec(key_to_bool, [ "!!!first", {
    first: false
} ], true);

// it 'handles multiple exclamation marks'
spec(key_to_bool, [ "first", {} ], undefined);

// it 'returns undefined if one non-nested key is specified, but not found'
spec(key_to_bool, [ "is_factor", {
    is_factor: true
} ], true);

spec(key_to_bool, [ "!is_factor", {
    is_factor: false
} ], true);

spec(key_to_bool, [ "is_factor", {
    is_ruby: false
} ], undefined);

spec(key_to_bool, [ "is_happy", {
    is_happy: true
} ], true);

spec(key_to_bool, [ "!is_happy", {
    is_happy: true
} ], false);

spec(key_to_bool, [ "is_happy", {
    is_happy: false
} ], false);

spec(key_to_bool, [ "!is_happy", {
    is_happy: false
} ], true);

spec_throws(key_to_bool, [ [ "is_factor" ], {} ], 'Value: ["is_factor"] !== is_string');

function key_to_bool(raw_key, data) {
    "use strict";
    var FRONT_BANGS = /^\!+/;
    var key = reduce(raw_key, be(is_string), _.trim, be(not(is_empty)));
    var bang_match = key.match(FRONT_BANGS);
    var dots = (bang_match ? key.replace(bang_match[0], "") : key).split(".");
    var keys = _.map(dots, _.trim);
    var current = data;
    var ans = false;
    _.detect(keys, function(key) {
        if (_.has(current, key)) {
            current = data[key];
            ans = !!current;
        } else {
            ans = undefined;
        }
        return !ans;
    });
    if (ans === undefined) return ans;
    if (bang_match) {
        _.times(bang_match[0].length, function() {
            ans = !ans;
        });
    }
    return ans;
}

/* jshint strict: true, undef: true */
/* globals be, is_enumerable, is_function, _ */
function map_x(coll, f) {
    "use strict";
    be(is_enumerable, coll);
    be(is_function, f);
    return _.map(coll, function(x) {
        return f(x);
    });
}

/* jshint strict: true, undef: true */
/* globals is_string, length, _  */
function is_whitespace(v) {
    "use strict";
    return is_string(v) && length(_.trim(v)) === 0;
}

/* jshint strict: true, undef: true */
function is_null_or_undefined(v) {
    "use strict";
    return v === null || v === undefined;
}

/* jshint strict: true, undef: true */
/* globals and, length */
function all(_funcs) {
    "use strict";
    var _and = and.apply(null, arguments);
    return function(arr) {
        for (var i = 0; i < length(arr); i++) {
            if (!_and(arr[i])) return false;
        }
        return true;
    };
}

/* jshint strict: true, undef: true */
/* globals _, to_string, function_to_name */
function function_sig(f, args) {
    "use strict";
    return function_to_name(f) + "(" + _.map(args, to_string).join(",") + ")";
}

/* jshint strict: true, undef: true */
/* globals spec, to_string */
spec(is_something, [ null ], false);

spec(is_something, [ undefined ], false);

spec(is_something, [ [] ], true);

spec(is_something, [ {} ], true);

spec(is_something, [ {
    a: "c"
} ], true);

function is_something(v) {
    "use strict";
    var t = typeof v;
    if (arguments.length !== 1) throw new Error("arguments.length !== 1: " + to_string(v));
    return t !== "null" && t !== "undefined";
}

/* jshint strict: true, undef: true */
function is_function(v) {
    "use strict";
    if (arguments.length !== 1) throw new Error("Invalid: arguments.length must === 1");
    return typeof v === "function";
}

/* jshint strict: true, undef: true */
/* globals spec_returns, spec_throws, to_string */
spec_returns(3, function own_property_returns_own_property() {
    "use strict";
    return own_property("num")({
        num: 3
    });
});

spec_throws(own_property("num"), [ {
    n: 4
} ], 'Key not found: "num" in {"n":4}');

function own_property(name) {
    "use strict";
    return function _own_property_(o) {
        if (!o.hasOwnProperty(name)) throw new Error("Key not found: " + to_string(name) + " in " + to_string(o));
        return o[name];
    };
}

/* jshint strict: true, undef: true */
/* globals function_to_name, _, to_string */
function to_function_string(f, args) {
    "use strict";
    return function_to_name(f) + "(" + _.map(args, to_string).join(", ") + ")";
}

/* jshint strict: true, undef: true */
/* globals spec, is_string, _, is_plain_object, is_empty, is_function, be, is_boolean */
spec(msg_match, [ 1, 1 ], true);

spec(msg_match, [ "a", "a" ], true);

spec(msg_match, [ [ 1 ], [ 1 ] ], true);

spec(msg_match, [ [ 1, [ 2 ] ], [ 1, [ 2 ] ] ], true);

spec(msg_match, [ {
    a: "b"
}, {
    a: "b",
    c: "d"
} ], true);

spec(msg_match, [ {
    a: is_string
}, {
    a: "b"
} ], true);

spec(msg_match, [ {}, {
    a: "b"
} ], false);

spec(msg_match, [ {}, {} ], true);

spec(msg_match, [ [], [] ], true);

function msg_match(pattern, msg) {
    "use strict";
    if (_.isEqual(pattern, msg)) return true;
    if (is_plain_object(pattern) && is_plain_object(msg)) {
        if (is_empty(pattern) !== is_empty(msg)) return false;
        return !_.detect(_.keys(pattern), function(key) {
            var target = pattern[key];
            if (msg[key] === target) return !true;
            if (is_function(target)) return !be(is_boolean, target(msg[key]));
            return !false;
        });
    }
    return false;
}

/* jshint strict: true, undef: true */
/* globals _ */
function reduce(value, _functions) {
    "use strict";
    var funcs = _.toArray(arguments);
    var v = funcs.shift();
    return _.reduce(funcs, function(acc, f) {
        return f(acc);
    }, v);
}

/* jshint strict: true, undef: true */
/* globals spec_returns, arguments_are, is_something, is_boolean, is_array, _, is_plain_object, reduce_eachs, to_string */
spec_returns({
    a: {
        b: "c"
    },
    b: true
}, function() {
    // Does not alter orig.
    "use strict";
    var orig = {
        a: {
            b: "c"
        },
        b: true
    };
    var copy = copy_value(orig);
    copy.a.b = "1";
    return orig;
});

function copy_value(v) {
    "use strict";
    arguments_are(arguments, is_something);
    var type = typeof v;
    if (type === "string" || type === "number" || is_boolean(v)) return v;
    if (is_array(v)) return _.map(v, function(v) {
        return copy_value(v);
    });
    if (is_plain_object(v)) return reduce_eachs({}, v, function(acc, kx, x) {
        acc[kx] = copy_value(x);
        return acc;
    });
    throw new Error("Value can't be copied: " + to_string(v));
}

/* jshint strict: true, undef: true */
/* globals spec_returns, is_function, spec_throws, arguments_are, is_something, to_string */
spec_returns(true, function has_length_returns_function() {
    "use strict";
    return is_function(has_length(1));
});

spec_returns(true, function has_length_returns_function_comparing_length() {
    "use strict";
    return has_length(1)([ 1 ]);
});

spec_returns(true, function has_length_returns_function_comparing_length_of_function() {
    "use strict";
    return has_length(2)(function(a, b) {});
});

spec_throws(function() {
    // returns function that returns false on length mismatch
    "use strict";
    return has_length(3)([ 1, 2 ]);
}, [], "[1, 2].length !== 3");

function has_length(num) {
    "use strict";
    return function _has_length_(val) {
        arguments_are(arguments, is_something);
        if (val.length === num) return true;
        throw new Error(to_string(val) + ".length !== " + to_string(num));
    };
}

/* jshint strict: true, undef: true */
/* globals spec_returns */
spec_returns(true, function() {
    "use strict";
    return is(5)(5);
});

spec_returns(false, function() {
    "use strict";
    return is("a")("b");
});

function is(target) {
    "use strict";
    return function(val) {
        return val === target;
    };
}

/* jshint strict: true, undef: true */
/* globals is_plain_object, _ */
function keys_or_indexes(v) {
    "use strict";
    if (is_plain_object(v)) return _.keys(v);
    var a = [];
    for (var i = 0; i < v.length; i++) {
        a[i] = i;
    }
    return a;
}

/* jshint strict: true, undef: true */
/* globals spec_returns, be, is_something, to_string, not, is_empty */
spec_returns('"4"', function to_value_returns_a_value() {
    "use strict";
    return to_value(4, to_string, to_string);
});

spec_returns(5, function to_value_returns_first_value_if_no_funcs() {
    "use strict";
    return to_value(5);
});

function to_value(val, _funcs) {
    "use strict";
    be(is_something, val);
    be(not(is_empty), arguments);
    var i = 1, l = arguments.length;
    while (i < l) {
        val = arguments[i](val);
        i = i + 1;
    }
    return val;
}

/* jshint strict: true, undef: true */
/* globals _ */
function is_array(v) {
    "use strict";
    return _.isArray(v);
}

/* jshint strict: true, undef: true */
/* globals spec */
spec(is_null, [ null ], true);

spec(is_null, [ undefined ], false);

function is_null(v) {
    "use strict";
    return v === null;
}

/* jshint strict: true, undef: true */
/* globals spec, _, is_arguments, is_plain_object, is_function */
spec(to_string, [ null ], "null");

spec(to_string, [ undefined ], "undefined");

spec(to_string, [ [ 1 ] ], "[1]");

spec(to_string, [ "yo yo" ], '"yo yo"');

spec(to_string, [ {
    a: "b",
    c: "d"
} ], '{"a":"b","c":"d"}');

function to_string(val) {
    "use strict";
    var v = val;
    if (val === null) return "null";
    if (val === undefined) return "undefined";
    if (val === false) return "false";
    if (val === true) return "true";
    if (_.isArray(val)) return "[" + _.map(val, to_string).join(", ") + "]";
    if (_.isString(val)) return '"' + val + '"';
    if (is_arguments(val)) return to_string(_.toArray(val));
    if (is_plain_object(val)) {
        return "{" + _.reduce(_.keys(val), function(acc, k) {
            acc.push(to_string(k) + ":" + to_string(val[k]));
            return acc;
        }, []).join(",") + "}";
    }
    if (is_function(val) && val.hasOwnProperty("to_string_name")) return val.to_string_name;
    if (_.isFunction(v)) return v.name ? v.name + " (function)" : v.toString();
    if (_.isString(v)) return '"' + v + '"';
    if (_.isArray(v)) return "[" + _.map(_.toArray(v), to_string).join(", ") + "] (Array)";
    if (v.constructor === arguments.constructor) return "[" + _.map(_.toArray(v), to_string).join(", ") + "] (arguments)";
    return val.toString();
}

/* jshint strict: true, undef: true */
/* globals to_string, function_sig */
function set_function_string_name(f, args) {
    "use strict";
    if (f.to_string_name) throw new Error(".to_string_name alread set: " + to_string(f.to_string_name));
    f.to_string_name = function_sig(f, args);
    return f;
}

/* jshint strict: true, undef: true */
function is_string(v) {
    "use strict";
    return typeof v === "string";
}

/* jshint strict: true, undef: true */
/* globals conditional */
function or(_funcs) {
    "use strict";
    return conditional("any", arguments);
}

/* jshint strict: true, undef: true */
/* globals length */
function sort_by_length(arr) {
    "use strict";
    return arr.sort(function(a, b) {
        return length(a) - length(b);
    });
}

/* jshint strict: true, undef: true */
function return_arguments() {
    "use strict";
    return arguments;
}

/* jshint strict: true, undef: true */
/* globals _, all, is_plain_object, is_array, to_string */
function combine(_vals) {
    "use strict";
    var vals = _.toArray(arguments);
    if (all(is_plain_object)(vals)) {
        return _.extend.apply(null, [ {} ].concat(vals));
    }
    if (all(is_array)(vals)) return [].concat(vals);
    throw new Error("Only Array of Arrays or Plain Objects allowed: " + to_string(arguments));
}

/* jshint strict: true, undef: true */
/* globals spec_returns, is_something, reduce, length, length_gt, is_something, to_string, is_function, is_null */
/* globals be, is_boolean, is */
spec_returns(true, function() {
    "use strict";
    return not(is_something)(null);
});

spec_returns(true, function() {
    "use strict";
    return not(length_gt(2), is_null)([ 1 ]);
});

spec_returns(false, function() {
    "use strict";
    return not(is_something)(1);
});

spec_returns(false, function() {
    "use strict";
    return not(is_something, is_null)(1);
});

function not(func) {
    "use strict";
    reduce(arguments, length, be(is(1)));
    var l = arguments.length;
    if (!is_function(func)) throw new Error("Not a function: " + to_string(func));
    return function _not_(val) {
        if (arguments.length !== 1) throw new Error("arguments.length !== 1");
        var result = func(val);
        if (!is_boolean(result)) throw new Error("Function did not return boolean: " + to_string(func) + " -> " + to_string(result));
        return !result;
    };
}

/* jshint strict: true, undef: true */
/* globals spec, is_string, to_string, _ */
spec(name_to_function, [ "name_to_function" ], name_to_function);

function name_to_function(raw) {
    "use strict";
    /* globals window, global */
    if (!is_string(raw)) throw new Error("Not a string: " + to_string(raw));
    var str = _.trim(raw);
    if (typeof str !== "function") throw new Error("Function not found: " + to_string(raw));
    return typeof "window" !== "undefined" ? window[str] : global[str];
}

/* jshint strict: true, undef: true */
/* globals _ */
function is_plain_object(v) {
    "use strict";
    return _.isPlainObject(v);
}

/* jshint strict: true, undef: true */
/* globals length */
function replace(pattern, new_value) {
    "use strict";
    if (length(arguments) === 3) {
        return arguments[2].replace(arguments[0], arguments[1]);
    }
    return function(v) {
        return v.replace(pattern, new_value);
    };
}

/* jshint strict: true, undef: true */
/* globals is_something, has_property_of, to_string */
function length_of(num) {
    "use strict";
    return function(v) {
        if (!is_something(v) && has_property_of("length", "number")(v)) throw new Error("invalid value for length_of: " + to_string(num));
        return v.length === num;
    };
}

/* jshint strict: true, undef: true */
/* globals spec, spec_throws, _, to_string */
spec(length, [ [ 1 ] ], 1);

spec(length, [ function() {} ], 0);

spec(length, [ function(a) {
    "use strict";
    return a;
} ], 1);

spec(length, [ {
    length: 3
} ], 3);

spec_throws(length, [ {} ], "invalid value for l(): {}");

function length(raw_v) {
    "use strict";
    if (raw_v === null || raw_v === undefined || !_.isFinite(raw_v.length)) throw new Error("Invalid value for length: " + to_string(raw_v));
    return raw_v.length;
}

/* jshint strict: true, undef: true */
/* globals spec */
spec(is_undefined, [ undefined ], true);

spec(is_undefined, [ null ], false);

function is_undefined(v) {
    "use strict";
    return v === undefined;
}

/* jshint strict: true, undef: true */
/* globals _ */
function conditional(name, funcs) {
    "use strict";
    if (funcs.length < 2) throw new Error("Called with too few arguments: " + arguments.length);
    if (!_[name]) throw new Error("_." + name + " does not exist.");
    return function(v) {
        return _[name](funcs, function(f) {
            return f(v);
        });
    };
}

/* jshint strict: true, undef: true */
/* globals _ */
function all_funcs(arr) {
    "use strict";
    var l = arr.length;
    return _.isFinite(l) && l > 0 && _.all(arr, _.isFunction);
}

/* jshint strict: true, undef: true */
/* globals set_function_string_name */
function has_own_property(name) {
    "use strict";
    var f = function __has_own_property(o) {
        return o.hasOwnProperty(name);
    };
    return set_function_string_name(f, arguments);
}

/* jshint strict: true, undef: true */
/* globals spec, spec_throws */
spec(is_anything, [ false ], true);

spec(is_anything, [ true ], true);

spec_throws(is_anything, [ null ], "null found");

spec_throws(is_anything, [ undefined ], "undefined found");

function is_anything(v) {
    "use strict";
    if (arguments.length !== 1) throw new Error("Invalid: arguments.length must === 1");
    if (v === null) throw new Error("'null' found.");
    if (v === undefined) throw new Error("'undefined' found.");
    return true;
}

/* jshint strict: true, undef: true */
/* globals console */
function log(_args) {
    "use strict";
    if (typeof console !== "undefined" && console.log) return console.log.apply(console, arguments);
    return false;
}

/* jshint strict: true, undef: true */
/* globals _, to_string */
function find_key(k, _args) {
    "use strict";
    var args = _.toArray(arguments);
    args.shift();
    var o = _.detect(args, function(x) {
        return x.hasOwnProperty(k);
    });
    if (!o) throw new Error("Key, " + to_string(k) + ", not found in any: " + to_string(args));
    return o[k];
}

/* jshint strict: true, undef: true */
/* globals spec, identity, _, is_undefined, to_string, be, is_function */
spec(dot("num"), [ {
    num: 3
} ], 3);

spec(dot("html()"), [ {
    html: identity("hyper")
} ], "hyper");

spec(dot("num"), [ {
    n: 4
} ], new Error('Property not found: "num" in {"n":4}'));

function dot(raw_name) {
    "use strict";
    var name = _.trimEnd(raw_name, "()");
    return function _dot_(o) {
        if (is_undefined(o[name])) throw new Error("Property not found: " + to_string(name) + " in " + to_string(o));
        if (name !== raw_name) {
            be(is_function, o[name]);
            return o[name]();
        } else return o[name];
    };
}

/* jshint strict: true, undef: true */
function length_gt(num) {
    "use strict";
    return function(v) {
        return v.length > num;
    };
}

/* jshint strict: true, undef: true */
/* globals spec, be, is_string, length, _ */
spec(is_blank_string, [ "" ], true);

spec(is_blank_string, [ "   " ], true);

spec(is_blank_string, [ " a  " ], false);

function is_blank_string(v) {
    "use strict";
    be(is_string, v);
    return length(_.trim(v)) < 1;
}

/* jshint strict: true, undef: true */
/* globals spec, is_array, eachs, to_string, is_plain_object */
spec(merge, [ {
    a: [ 1 ]
}, {
    a: [ 2, 3 ]
} ], {
    a: [ 1, 2, 3 ]
});

spec(merge, [ [ 1 ], [ 2, 3 ] ], [ 1, 2, 3 ]);

spec(merge, [ {
    a: 1
}, {
    b: 2
}, {
    c: 3
} ], {
    a: 1,
    b: 2,
    c: 3
});

function merge(_args) {
    "use strict";
    if (arguments.length === 0) throw new Error("Arguments misisng.");
    var type = is_array(arguments[0]) ? "array" : "plain object";
    var fin = type === "array" ? [] : {};
    eachs(arguments, function(kx, x) {
        if (type === "array" && !is_array(x)) throw new Error("Value needs to be an array: " + to_string(x));
        if (type === "plain object" && !is_plain_object(x)) throw new Error("Value needs to be a plain object: " + to_string(x));
        eachs(x, function(key, val) {
            if (type === "array") {
                fin.push(val);
                return;
            }
            if (fin[key] === val || !fin.hasOwnProperty(key)) {
                fin[key] = val;
                return;
            }
            if (is_array(fin[key]) && is_array(val)) {
                fin[key] = [].concat(fin[key]).concat(val);
                return;
            }
            if (is_plain_object(fin[key]) && is_plain_object(val)) {
                fin[key] = merge(fin[key], val);
                return;
            }
            throw new Error("Could not merge key: [" + to_string(key) + "] " + to_string(fin[key]) + " -> " + to_string(val));
        });
    });
    return fin;
}

/* jshint strict: true, undef: true */
/* globals length */
function is_length_zero(v) {
    "use strict";
    return length(v) === 0;
}

/* jshint strict: true, undef: true */
function is_boolean(v) {
    "use strict";
    return typeof v === "boolean";
}

/* jshint strict: true, undef: true */
/* globals spec, to_string, _, is_enumerable, is_undefined, length, keys_or_indexes */
// TODO: spec: does not modify arr
spec(reduce_eachs, [ [], [ 1, 2 ], function(v, kx, x) {
    "use strict";
    v.push("" + kx + x);
    return v;
} ], [ "01", "12" ]);

spec(reduce_eachs, [ [], [ 1, 2 ], [ "a", "b" ], function(v, kx, x, ky, y) {
    "use strict";
    v.push("" + x + y);
    return v;
} ], [ "1a", "1b", "2a", "2b" ]);

spec(reduce_eachs, [ [], {
    one: 1,
    two: 2
}, [ "a" ], function(v, kx, x, ky, y) {
    "use strict";
    v.push("" + kx + y);
    return v;
} ], [ "onea", "twoa" ]);

spec(reduce_eachs, [ [], {
    one: 1,
    two: 2
}, [], [ "a" ], function(v, kx, x, ky, y, kz, z) {
    "use strict";
    v.push("" + kx + y);
    return v;
} ], []);

function reduce_eachs() {
    "use strict";
    var args = _.toArray(arguments);
    if (args.length < 3) throw new Error("Not enough args: " + to_string(args));
    var init = args.shift();
    var f = args.pop();
    // === Validate inputs before continuing:
    for (var i = 0; i < args.length; i++) {
        if (!is_enumerable(args[i])) throw new Error("Invalid value for reduce_eachs: " + to_string(args[i]));
    }
    if (is_undefined(init)) throw new Error("Invalid value for init: " + to_string(init));
    // === Process inputs:
    var cols_length = length(args);
    return reduce_eachs_row_maker([ init ], 0, _.map(args, keys_or_indexes));
    function reduce_eachs_row_maker(row, col_i, key_cols) {
        if (col_i >= cols_length) {
            if (row.length !== f.length) throw new Error("f.length (" + f.length + ") should be " + row.length + " (collection count * 2 + 1 (init))");
            row[0] = f.apply(null, [].concat(row));
            // set reduced value
            return row[0];
        }
        var keys = key_cols[col_i].slice(0);
        var vals = args[col_i];
        ++col_i;
        for (var i = 0; i < keys.length; i++) {
            row.push(keys[i]);
            // key
            row.push(vals[keys[i]]);
            // actual value
            reduce_eachs_row_maker(row, col_i, key_cols);
            row.pop();
            row.pop();
        }
        return row[0];
    }
}

/* jshint strict: true, undef: true */
/* globals spec */
spec(function_to_name, [ "function my_name() {}" ], "my_name");

function function_to_name(f) {
    "use strict";
    var WHITESPACE = /\s+/g;
    return f.to_string_name || f.toString().split("(")[0].split(WHITESPACE)[1] || f.toString();
}

/* jshint strict: true, undef: true */
/* globals spec, is_array, is_string, is_plain_object, _, is_arguments */
spec(is_enumerable, [ [] ], true);

spec(is_enumerable, [ {} ], true);

spec(is_enumerable, [ {} ], true);

function is_enumerable(v) {
    "use strict";
    return is_string(v) || is_array(v) || is_plain_object(v) || _.isFinite(v.length) || is_arguments(v);
}

/* jshint strict: true, undef: true */
/* globals spec, _ */
spec(standard_name, [ "NAME NAME" ], "name name");

// it 'lowercases names'
spec(standard_name, [ "  name  " ], "name");

// it 'trims string'
spec(standard_name, [ "n   aME" ], "n ame");

// it 'squeezes whitespace'
function standard_name(str) {
    "use strict";
    var WHITESPACE = /\s+/g;
    return _.trim(str).replace(WHITESPACE, " ").toLowerCase();
}

/* jshint strict: true, undef: true */
/* globals spec, is_num, _, to_string */
spec(arguments_are, [ [ 1 ], is_num, is_num ], new Error("Wrong # of arguments: expected: 2 actual: 1)"));

function arguments_are(args_o, _funcs) {
    "use strict";
    var funcs = _.toArray(arguments);
    var args = funcs.shift();
    if (args.length !== funcs.length) {
        throw new Error("Wrong # of arguments: expected: " + funcs.length + " actual: " + args.length);
    }
    for (var i = 0; i < funcs.length; i++) {
        if (!funcs[i](args[i])) throw new Error("Invalid arguments: " + to_string(args[i]) + " !" + to_string(funcs[i]));
    }
    return _.toArray(args);
}

/* jshint strict: true, undef: true */
/* globals _, to_string */
function to_match_string(actual, expect) {
    "use strict";
    if (_.isEqual(actual, expect)) return to_string(actual) + " === " + to_string(expect); else return to_string(actual) + " !== " + to_string(expect);
}

/* jshint strict: true, undef: true */
/* globals spec, arguments_are, is_something, is_string, _, is_empty, map_x, is_blank_string */
spec(split_on, [ /;/, "a;b;c" ], [ "a", "b", "c" ]);

spec(split_on, [ /;/, "a;b;c" ], [ "a", "b", "c" ]);

spec(split_on, [ /;/, "a; ;c" ], [ "a", "c" ]);

function split_on(pattern, str) {
    "use strict";
    arguments_are(arguments, is_something, is_string);
    var trim = _.trim(str);
    if (is_empty(trim)) return [];
    return _.compact(map_x(trim.split(pattern), function(x) {
        return !is_blank_string(x) && _.trim(x);
    }));
}

/* jshint strict: true, undef: true */
/* globals is_array, is_arguments, to_string, function_to_name */
function apply_function(f, args) {
    "use strict";
    if (arguments.length !== 2) throw new Error("Wrong # of argumments: expected: " + 2 + " actual: " + arguments.length);
    if (!is_array(args) && !is_arguments(args)) throw new Error("Not an array/arguments: " + to_string(args));
    if (f.length !== args.length) throw new Error("function.length (" + function_to_name(f) + " " + f.length + ") !== " + args.length);
    return f.apply(null, args);
}

/* jshint strict: true, undef: true */
function identity(x) {
    "use strict";
    if (arguments.length !== 1) throw new Error("arguments.length !== 0");
    return x;
}

/* jshint strict: true, undef: true */
/* globals spec_returns, _, to_string, is_enumerable, length, keys_or_indexes */
// TODO: spec :eachs does not alter inputs
spec_returns([ "01", "12" ], function eachs_passes_key_and_val() {
    "use strict";
    var v = [];
    eachs([ 1, 2 ], function(kx, x) {
        v.push("" + kx + x);
    });
    return v;
});

spec_returns([ "1a", "1b", "2a", "2b" ], function eachs_passes_vals_of_multiple_colls() {
    "use strict";
    var v = [];
    eachs([ 1, 2 ], [ "a", "b" ], function(kx, x, ky, y) {
        v.push("" + x + y);
    });
    return v;
});

spec_returns([ "onea", "twoa" ], function eachs_passes_keys_and_vals_of_arrays_and_plain_objects() {
    "use strict";
    var v = [];
    eachs({
        one: 1,
        two: 2
    }, [ "a" ], function(kx, x, ky, y) {
        v.push("" + kx + y);
    });
    return v;
});

spec_returns([ "1a", "1b", "2a", "2b" ], function eachs_passes_vals_of_plain_object_and_array() {
    "use strict";
    var v = [];
    eachs({
        one: 1,
        two: 2
    }, [ "a", "b" ], function(kx, x, ky, y) {
        v.push("" + x + y);
    });
    return v;
});

spec_returns([], function eachs_returns_empty_array_if_one_array_is_empty() {
    "use strict";
    var v = [];
    eachs({
        one: 1,
        two: 2
    }, [], [ "a" ], function(kx, x, ky, y, kz, z) {
        v.push("" + kx + y);
    });
    return v;
});

function eachs() {
    "use strict";
    var args = _.toArray(arguments);
    if (args.length < 2) throw new Error("Not enough args: " + to_string(args));
    var f = args.pop();
    // === Validate inputs before continuing:
    for (var i = 0; i < args.length; i++) {
        if (!is_enumerable(args[i])) throw new Error("Invalid value for eachs: " + to_string(args[i]));
    }
    // === Process inputs:
    var cols_length = length(args);
    return eachs_row_maker([], 0, _.map(args, keys_or_indexes));
    function eachs_row_maker(row, col_i, key_cols) {
        if (col_i >= cols_length) {
            if (row.length !== f.length) throw new Error("f.length (" + f.length + ") should be " + row.length + " (collection count * 2 )");
            f.apply(null, [].concat(row));
            // set reduced value
            return;
        }
        var keys = key_cols[col_i].slice(0);
        var vals = args[col_i];
        ++col_i;
        for (var i = 0; i < keys.length; i++) {
            row.push(keys[i]);
            // key
            row.push(vals[keys[i]]);
            // actual value
            eachs_row_maker(row, col_i, key_cols);
            row.pop();
            row.pop();
        }
        return;
    }
}

/* jshint strict: true, undef: true */
function is_positive(v) {
    "use strict";
    return typeof v === "number" && isFinite(v) && v > 0;
}

/* jshint strict: true, undef: true */
/* globals spec, _, length_gt */
spec(is_array_of_functions, [ [ function() {} ] ], true);

spec(is_array_of_functions, [ [] ], false);

spec(is_array_of_functions, [ [ 1 ] ], false);

spec(is_array_of_functions, [ 1 ], false);

function is_array_of_functions(a) {
    "use strict";
    return _.isArray(a) && length_gt(a) > 0 && _.all(a, _.isFunction);
}

/* jshint strict: true, undef: true */
/* globals spec_returns, identity, to_string, is_function, _, apply_function */
spec_returns(true, function to_function_returns_sole_function() {
    "use strict";
    var f = function() {};
    return to_function(f) === f;
});

spec_returns(2, function to_function_returns_an_identity_function() {
    "use strict";
    return to_function(2)();
});

spec_returns('"3"', function to_function_returns_a_function() {
    "use strict";
    return to_function(identity, to_string, to_string)(3);
});

function to_function() {
    "use strict";
    if (arguments.length === 1) {
        if (is_function(arguments[0])) {
            return arguments[0];
        } else {
            var x = arguments[0];
            return function() {
                return x;
            };
        }
    }
    var i = 0, f;
    var l = arguments.length;
    while (i < l) {
        f = arguments[i];
        if (!_.isFunction(f)) throw new Error("Not a function: " + to_string(f));
        i = i + 1;
    }
    var funcs = arguments;
    return function() {
        var i = 0, f, val;
        while (i < l) {
            f = funcs[i];
            if (i === 0) {
                if (f.length !== arguments.length) throw new Error("Function.length " + f.length + " " + to_string(f) + " !=== arguments.length " + arguments.length + " " + to_string(arguments));
                val = apply_function(f, arguments);
            } else {
                if (f.length !== 1) throw new Error("Function.length " + f.length + " !=== 1");
                val = apply_function(f, [ val ]);
            }
            i = i + 1;
        }
        return val;
    };
}

/* jshint strict: true, undef: true */
/* globals spec, return_arguments, is_something, or, is, is_positive */
spec(is_arguments, [ return_arguments() ], true);

spec(is_arguments, [ [] ], false);

function is_arguments(v) {
    "use strict";
    return is_something(v) && or(is(0), is_positive)(v.length) && v.hasOwnProperty("callee");
}

/* jshint strict: true, undef: true */
/* globals spec, is_string, is_function, is_num, is_something, is_null, _, length, to_string */
spec(be, [ 1, is_num ], 1);

spec(be, [ is_num, "1" ], new Error('Value: "1" !== is_num'));

spec(be, [ is_string, 2 ], new Error("Value: 2 !== is_string"));

function be(func, val) {
    "use strict";
    switch (length(arguments)) {
      case 2:
        if (!func) throw new Error(to_string(val) + " should be: " + to_string(func));
        return val;

      case 1:
        be(is_function, func);
        return function(v) {
            return be(func, v);
        };

      default:
        throw new Error("Invalid arguments.");
    }
}

/* jshint strict: true, undef: true */
/* globals _, and */
function find(_funcs) {
    "use strict";
    var funcs = _.toArray(arguments);
    return function(v) {
        return _.find(v, and.apply(null, funcs));
    };
}

/* jshint strict: true, undef: true */
/* globals Computer, is_empty */
// === Examples:
// App()
// App(..args for underlying Computer)
function App() {
    "use strict";
    if (!App._computer) {
        App._computer = new Computer();
    }
    if (!is_empty(arguments)) App._computer.apply(null, arguments);
    return App;
}

/* jshint strict: true, undef: true */
/* globals is_array, spec_returns, arguments_are, reduce_eachs, copy_value, do_it, and, is, is_plain_object */
/* globals to_string, apply_function, has_length, is_function, msg_match, function_to_name */
spec_returns(3, function() {
    "use strict";
    var counter = 0;
    var data = {
        my_name: "happy"
    };
    var state = new Computer();
    state("push", function(msg) {
        if (!msg_match({
            my_name: "happy"
        }, msg)) return;
        ++counter;
    });
    do_it(3, function() {
        state("run", data);
    });
    return counter;
});

function Computer() {
    "use strict";
    return State;
    function State(action, args) {
        if (action === "invalid") {
            State.is_invalid = true;
            return;
        }
        if (State.is_invalid === true) throw new Error("state is invalid.");
        if (!is_array(State.funcs)) State.funcs = [];
        var funcs = State.funcs.slice(0);
        switch (action) {
          case "push":
            arguments_are(arguments, is("push"), and(is_function, has_length(1)));
            var func = arguments[1];
            if (func.length !== 1) throw new Error("function.length needs to === 1: " + function_to_name(func));
            State.funcs = funcs.slice(0).concat([ func ]);
            return true;

          case "run":
            arguments_are(arguments, is("run"), is_plain_object);
            var msg = arguments[1];
            return reduce_eachs([], funcs, function(acc, _ky, func) {
                try {
                    var msg_copy = copy_value(msg);
                    acc.push(apply_function(func, [ msg_copy ]));
                } catch (e) {
                    State("invalid");
                    throw e;
                }
                return acc;
            });

          default:
            State("invalid");
            throw new Error("Unknown action for state: " + to_string(action));
        }
    }
}

/* jshint strict: true, undef: true */
/* globals App, be, is_string, key_to_bool, is_boolean, $, spec_dom, spec_returns */
spec_returns("", function() {
    // show: shows element when key is true
    "use strict";
    spec_dom().html('<div data-do="show is_factor" style="display: none;">Factor</div>');
    App("run", {
        "dom-change": true
    });
    App("run", {
        is_factor: true
    });
    return spec_dom().find("div").attr("style");
});

spec_returns("display: none;", function() {
    // does not alter element msg is missing key
    "use strict";
    spec_dom().html('<div data-do="show is_pearl" style="display: none;">Pearl</div>');
    App("run", {
        "dom-change": true
    });
    App("run", {
        is_factor: true
    });
    return spec_dom().find("div").attr("style");
});

function show(msg) {
    "use strict";
    var dom_id = be(is_string, msg.dom_id);
    var key = be(is_string, msg.args[0]);
    App("push", function _show_(msg) {
        var answer = key_to_bool(key, msg);
        if (is_boolean(answer) !== true) return;
        $("#" + dom_id).show();
        return "show: " + dom_id;
    });
}

/* jshint strict: true, undef: true */
/* globals spec_returns, spec_dom, $, _, is_empty, new_id */
spec_returns("has id", function dom_id_adds_id_attr_to_element() {
    "use strict";
    spec_dom().html("<div>has id</div>");
    var id = dom_id(spec_dom().find("div:first"));
    return $("#" + id).html();
});

spec_returns("dom_id_does_not_override_original_id", function dom_id_does_not_override_original_id() {
    "use strict";
    spec_dom().html('<div id="dom_id_does_not_override_original_id">override id</div>');
    return dom_id(spec_dom().find("div:first"));
});

// Returns id.
// Sets id of element if no id is set.
//
// .dom_id(raw_or_jquery)
// .dom_id('prefix', raw_or_jquer)
function dom_id() {
    "use strict";
    var args = _.toArray(arguments);
    var o = _.find(args, _.negate(_.isString));
    var prefix = _.find(args, _.isString);
    var old = o.attr("id");
    if (old && !is_empty(old)) return old;
    var str = new_id(prefix || "default_id_");
    o.attr("id", str);
    return str;
}

/* jshint strict: true, undef: true */
/* jshint strict: true, undef: true */
function is_partial($) {
    "use strict";
    return $("html").length === 0;
}

/* jshint strict: true, undef: true */
/* globals spec_returns, is_num, is_empty */
spec_returns(false, function() {
    // next_id returns a different value than previous
    "use strict";
    return next_id() === next_id();
});

function next_id() {
    "use strict";
    if (!is_num(next_id.count)) next_id.count = -1;
    next_id.count = next_id.count + 1;
    if (is_empty(arguments)) return next_id.count;
    return arguments[0] + "_" + next_id.count;
}

/* jshint strict: true, undef: true */
/* globals is_plain_object, be, $, spec_dom, spec_returns, App, is_string, key_to_bool, is_boolean */
spec_returns("", function _show_hide() {
    // === show_hide shows element if key = true
    "use strict";
    spec_dom().html('<div data-do="show_hide is_ruby" style="display: none;">Ruby</div>');
    App("run", {
        "dom-change": true
    });
    App("run", {
        is_ruby: true
    });
    return spec_dom().find("div").attr("style");
});

spec_returns("display: none;", function _show_hide() {
    // === show_hide hides element if key = false
    "use strict";
    spec_dom().html('<div data-do="show_hide is_ruby" style="">Perl</div>');
    App("run", {
        "dom-change": true
    });
    App("run", {
        is_ruby: false
    });
    return spec_dom().find("div").attr("style");
});

function show_hide(msg) {
    "use strict";
    var dom_id = be(is_string, msg.dom_id);
    var key = be(is_string, msg.args[0]);
    App("push", function _show_hide_(msg) {
        if (!is_plain_object(msg)) return;
        var answer = key_to_bool(key, msg);
        if (!is_boolean(answer)) return;
        if (answer) return $("#" + dom_id).show(); else return $("#" + dom_id).hide();
    });
}

/* jshint strict: true, undef: true */
/* globals spec, _, $, dom_attrs, spec_returns */
// it 'returns an Array when passed a String'
spec(node_array, [ '<div id="111" show_if="happy?"><span></span></div>' ], [ {
    tag: "DIV",
    attrs: {
        id: "111",
        show_if: "happy?"
    },
    custom: {},
    childs: [ {
        tag: "SPAN",
        attrs: {},
        custom: {},
        childs: []
    } ]
} ]);

spec_returns([ "a", undefined, "b" ], function node_array_returns_raw_text_nodes() {
    "use strict";
    var arr = node_array("<div><span>a<span></span>b</span></div>");
    return _.pluck(arr[0].childs[0].childs, "nodeValue");
});

function node_array(unknown) {
    "use strict";
    var arr = [];
    _.each($(unknown), function(dom) {
        if (dom.nodeType !== 1) return arr.push(dom);
        arr.push({
            tag: dom.nodeName,
            attrs: dom_attrs(dom),
            custom: {},
            childs: node_array($(dom).contents())
        });
    });
    return arr;
}

/* jshint strict: true, undef: true */
/* globals arguments_are, spec, $, has_property_of, _ */
spec(dom_attrs, [ $('<div id="000" img=".png"></div>')[0] ], {
    id: "000",
    img: ".png"
});

spec(dom_attrs, [ $('<div class="is_happy"></div>')[0] ], {
    class: "is_happy"
});

function dom_attrs(dom) {
    "use strict";
    arguments_are(arguments, has_property_of("attributes", "object"));
    return _.reduce(dom.attributes, function(kv, o) {
        kv[o.name] = o.value;
        return kv;
    }, {});
}

/* jshint strict: true, undef: true */
/* globals spec, _ */
spec(html_escape, [ "<p>{{a}}</p>" ], "&lt;p&gt;&#123;&#123;a&#125;&#125;&lt;/p&gt;");

function html_escape(str) {
    "use strict";
    return _.escape(str).replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");
}

/* jshint strict: true, undef: true */
function is_$(v) {
    "use strict";
    return v && typeof v.html === "function" && typeof v.attr === "function";
}

/* jshint strict: true, undef: true */
// Examples:
//
//   .new_id()           ->  Integer
//   .new_id('prefix_')  ->  String
//
function new_id(prefix) {
    "use strict";
    if (!new_id.hasOwnProperty("_id")) new_id._id = -1;
    new_id._id = new_id._id + 1;
    return prefix ? prefix + new_id._id : new_id._id;
}

/* jshint strict: true, undef: true */
/* globals spec_returns, spec_dom, _, next_id, $ */
spec_returns("top_descendents_returns_self_if_selector_matches", function top_descendents_returns_self_if_selector_matches() {
    "use strict";
    spec_dom().html('<div id="top_descendents_returns_self_if_selector_matches" template="num"></div>');
    return top_descendents(spec_dom().children(), "*[template]")[0].attr("id");
});

spec_returns([ "SPAN", "SPAN" ], function() {
    // it 'returns first children matching selector'
    "use strict";
    spec_dom().html('<div><span class="top"></span><span class="top"></span></div>');
    return _.map(top_descendents(spec_dom().children(), ".top"), function(n) {
        return n[0].tagName;
    });
});

spec_returns([ [ "DIV", "top_descendents_1" ] ], function() {
    // does not return nested matching descendants if ancestor matches selector'
    "use strict";
    var id = next_id();
    spec_dom().html('<div><div id="top_descendents_1" class="top"><span class="top"></span><span class="top"></span></div><div>');
    return _.map(top_descendents(spec_dom().children(), ".top"), function(n) {
        return [ n[0].tagName, n.attr("id") ];
    });
});

function top_descendents(dom, selector) {
    "use strict";
    var arr = [];
    _.each($(dom), function(node) {
        var o = $(node);
        if (o.is(selector)) return arr.push(o);
        arr = arr.concat(top_descendents(o.children(), selector));
    });
    // === func
    return arr;
}

/* jshint strict: true, undef: true */
/* globals spec_returns, spec_dom, _, $ */
// it 'returns value of the attribute'
spec_returns("one", function remove_attr_returns_value_of_the_attribute() {
    "use strict";
    spec_dom().html('<div show_if="one"></div>');
    return remove_attr(spec_dom().find("div:first"), "show_if");
});

// it 'removes attribute from node'
spec_returns({
    id: "remove_attr_1"
}, function remove_attr_removes_attribute_from_node() {
    "use strict";
    spec_dom().html('<div id="remove_attr_1" show_if="one"></div>');
    remove_attr(spec_dom().find("div:first"), "show_if");
    return _.reduce(spec_dom().find("div:first")[0].attributes, function(a, v) {
        a[v.name] = v.value;
        return a;
    }, {});
});

function remove_attr(node, name) {
    "use strict";
    var val = $(node).attr(name);
    $(node).removeAttr(name);
    return val;
}

/* jshint strict: true, undef: true */
/* globals spec, window */
spec(is_dev, [], window.location.href.indexOf("/specs.html") > 0);

function is_dev() {
    "use strict";
    var addr = window.location.href;
    return window.console && (addr.indexOf("localhost") > -1 || addr.indexOf("file:///") > -1 || addr.indexOf("127.0.0.1") > -1);
}

/* jshint strict: true, undef: true */
/* globals App, is_string, key_to_bool, is_string, $, spec_dom, spec_returns, be */
spec_returns("display: none;", function() {
    // hide: hides element when key is true
    "use strict";
    spec_dom().html('<div data-do="hide is_factor">Factor</div>');
    App("run", {
        "dom-change": true
    });
    App("run", {
        is_factor: true
    });
    return spec_dom().find("div").attr("style");
});

spec_returns("", function() {
    // does not alter element if msg has missing key
    "use strict";
    spec_dom().html('<div data-do="hide is_dog" style="">Dog</div>');
    App("run", {
        "dom-change": true
    });
    App("run", {
        is_cat: true
    });
    return spec_dom().find("div").attr("style");
});

function hide(msg) {
    "use strict";
    var dom_id = be(is_string, msg.dom_id);
    var key = be(is_string, msg.args[0]);
    App("push", function _hide_(msg) {
        if (key_to_bool(key, msg) !== true) return;
        $("#" + dom_id).hide();
        return "hide: " + msg.dom_id;
    });
}

/* jshint strict: true, undef: true */
/* globals $ */
function to_$(x) {
    "use strict";
    return $(x);
}

/* jshint strict: true, undef: true */
/* globals $ */
function outer_html(raw) {
    "use strict";
    return raw.map(function() {
        return $(this).prop("outerHTML");
    }).toArray().join("");
}

/* jshint strict: true, undef: true */
/* globals spec, spec_returns, to_value, html_escape, DOMParser */
spec(html_unescape, [ "&lt;p&gt;&#123;&#123;1&#125;&#125;&lt;/p&gt;" ], "<p>{{1}}</p>");

spec_returns("<p>{{1}}</p>", function html_unescape_multiple_times() {
    "use strict";
    return to_value("<p>{{1}}</p>", html_escape, html_escape, html_escape, html_unescape, html_unescape, html_unescape);
});

function html_unescape(raw) {
    "use strict";
    // From: http://stackoverflow.com/questions/1912501/unescape-html-entities-in-javascript
    return new DOMParser().parseFromString(raw, "text/html").documentElement.textContent;
}

/* jshint strict: true, undef: true */
/* globals msg_match, has_length, is_string, be, is_array, and, window, is_function, $ */
function on_click(msg) {
    "use strict";
    if (!msg_match({
        dom_id: is_string,
        args: and(is_array, has_length(1))
    }, msg)) return;
    var dom_id = msg.dom_id;
    var func = be(is_function, window[msg.args[0]]);
    if (!on_click.processed) on_click.processed = {};
    if (on_click.processed[dom_id]) throw new Error("#" + dom_id + " already processed by on_click");
    on_click.processed[dom_id] = true;
    $("#" + msg.dom_id).on("click", function(e) {
        e.stopPropagation();
        func({
            dom_id: dom_id
        });
    });
}

/* jshint strict: true, undef: true */
/* globals App, html_escape, to_function, dot, map_x, to_$, $, msg_match, key_to_bool, be */
/* globals is_string, eachs, html_unescape, Mustache, dom_id */
/* globals spec_returns, spec_dom, _, is_plain_object, is_array */
spec_returns([ "SCRIPT", "SPAN", "P" ], function template_replaces_elements_by_default() {
    "use strict";
    spec_dom().html('<script type="application/template" data-do="template is_text replace">' + html_escape("<span>{{a1}}</span>") + html_escape("<p>{{a2}}</p>") + "</script>");
    App("run", {
        "dom-change": true
    });
    App("run", {
        is_text: true,
        data: {
            a1: "1",
            a2: "2"
        }
    });
    App("run", {
        is_text: true,
        data: {
            a1: "3",
            a2: "4"
        }
    });
    return _.map(spec_dom().children(), dot("tagName"));
});

spec_returns([ "SCRIPT", "P", "DIV" ], function template_renders_elements_below_by_default() {
    "use strict";
    spec_dom().html('<script type="application/template" data-do="template is_text replace">' + html_escape("<p>one</p>") + html_escape("<div>two</div>") + "</script>");
    App("run", {
        "dom-change": true
    });
    App("run", {
        is_text: true
    });
    return _.map(spec_dom().children(), dot("tagName"));
});

spec_returns("123", function template_renders_nested_vars() {
    "use strict";
    spec_dom().html('<script type="application/template" data-do="template is_text replace">' + html_escape("<p>{{a}}</p>") + html_escape("<p>{{b}}</p>") + html_escape('<script type="application/template" data-do="template is_val replace">') + html_escape(html_escape("<p>{{c}}</p>")) + html_escape("</script>") + "</script>");
    App("run", {
        "dom-change": true
    });
    App("run", {
        is_text: true,
        data: {
            a: 1,
            b: 2
        }
    });
    App("run", {
        is_val: true,
        data: {
            c: "3"
        }
    });
    return map_x(spec_dom().find("p"), to_function(to_$, dot("html()"))).join("");
});

spec_returns([ "P", "P", "SCRIPT" ], function template_renders_above() {
    "use strict";
    spec_dom().html('<script type="application/template" data-do="template is_text above">' + html_escape("<p>{{a}}</p>") + html_escape("<p>{{b}}</p>") + "</script>");
    App("run", {
        "dom-change": true
    });
    App("run", {
        is_text: true,
        data: {
            a: 4,
            b: 5
        }
    });
    return map_x(spec_dom().children(), dot("tagName"));
});

spec_returns([ "SCRIPT", "SPAN", "P" ], function template_renders_below() {
    "use strict";
    spec_dom().html('<script type="application/template" data-do="template is_text bottom">' + html_escape("<span>{{a}}</span>") + html_escape("<p>{{b}}</p>") + "</script>");
    App("run", {
        "dom-change": true
    });
    App("run", {
        is_text: true,
        data: {
            a: 6,
            b: 7
        }
    });
    return map_x(spec_dom().children(), dot("tagName"));
});

spec_returns("none", function template_renders_dum_functionality() {
    "use strict";
    spec_dom().html('<script type="application/template" data-do="template render_template replace">' + html_escape('<div><span id="template_1" data-do="hide is_num">{{num.word}}</span></div>') + "</script>");
    App("run", {
        "dom-change": true
    });
    App("run", {
        render_template: true
    });
    App("run", {
        is_num: true,
        data: {
            num: {
                word: "one"
            }
        }
    });
    return $("#template_1").css("display");
});

function template(msg) {
    "use strict";
    if (!msg_match({
        dom_id: is_string
    }, msg)) return;
    var key = be(is_string, msg.args[0]);
    var pos = be(is_string, msg.args[1]);
    var t = $("#" + msg.dom_id);
    var raw_html = t.html();
    var id = msg.dom_id;
    function _template_(future_msg) {
        if (key_to_bool(key, future_msg) !== true) return;
        var me = _template_;
        // === Init state:
        if (!is_plain_object(me.elements)) me.elements = {};
        if (!is_array(me.elements[id])) me.elements[id] = [];
        // === Remove old nodes:
        if (pos === "replace") {
            eachs(me.elements[id], function(_index, id) {
                $("#" + id).remove();
            });
        }
        var decoded_html = html_unescape(raw_html);
        var compiled = $(Mustache.render(decoded_html, future_msg.data || {}));
        var new_ids = _.map(compiled, function(x) {
            return dom_id($(x));
        });
        if (pos === "replace" || pos === "bottom") compiled.insertAfter($("#" + id)); else compiled.insertBefore($("#" + id));
        me.elements[id] = [].concat(me.elements[id]).concat(new_ids);
        App("run", {
            "dom-change": true
        });
        return new_ids;
    }
    App("push", _template_);
}

/* jshint strict: true, undef: true */
/* globals spec, window */
spec(is_localhost, [], window.location.href.indexOf("/specs.html") > 0);

function is_localhost() {
    "use strict";
    var addr = window.location.href;
    return window.console && (addr.indexOf("localhost") > -1 || addr.indexOf("file:///") > -1 || addr.indexOf("127.0.0.1") > -1);
}

/* jshint strict: true, undef: true */
/* globals msg_match, is_string, $, dom_id, alite, formToObj, is_plain_object, log, is_blank_string */
/* globals App */
function submit_form(msg) {
    "use strict";
    if (!msg_match({
        dom_id: is_string
    }, msg)) return;
    var form = $("#" + msg.dom_id).closest("form");
    var raw_form = form[0];
    if (!raw_form) return;
    var form_dom_id = dom_id(form);
    // the form_id
    // the form as a data structure
    // Create callback for response
    //   -- standardize response
    //   -- send to Computer/App
    // Send to ajax w/callback
    alite({
        url: form.attr("action"),
        method: "POST",
        data: formToObj(raw_form)
    }).then(function(result) {
        // At this point, we don't know if it's success or err:
        var data = {
            ajax_response: true,
            result: result,
            data: result.data || {}
        };
        // === If err:
        if (!is_plain_object(result) || !result.ok) {
            data.msg = result.msg || "Computer error. Try again later.";
            data["err_" + form_dom_id] = true;
            App("run", data);
            return;
        }
        // === else success:
        data["ok_" + form_dom_id] = true;
        App("run", data);
    }).catch(function(err) {
        log(err);
        var data = {
            ajax_err: true
        };
        if (is_string(err)) {
            if (is_blank_string(err)) data.msg = "Network error."; else data.msg = err;
        }
        data["err_" + form_dom_id] = true;
        App("run", data);
    });
}

/* jshint strict: true, undef: true */
/* globals spec_returns, spec_dom, html_escape, App, wait_max, $, msg_match, length */
/* globals eachs, split_on, is_empty, to_string, name_to_function, apply_function, dom_id */
// ==== Integration tests =====================================================
// ============================================================================
spec_returns("yo mo", function button_submit(fin) {
    "use strict";
    spec_dom().html('<form id="the_form" action="/repeat">' + '<script type="application/template" data-do="template ok_the_form replace">' + html_escape("<div>{{val1}} {{val2}}</div>") + '</script><button onclick="return false;" data-do="on_click submit_form">Submit</button>' + '<input type="hidden" name="val1" value="yo" />' + '<input type="hidden" name="val2" value="mo" />' + "</form>");
    App("run", {
        "dom-change": true
    });
    spec_dom().find("button").click();
    wait_max(1.5, function() {
        var html = spec_dom().find("div").html();
        if (!html) return false;
        fin(html);
        return true;
    });
});

// === Adds functionality:
//     <div data-do="my_func arg1 arg2">content</div>
App("push", function process_data_dos(msg) {
    "use strict";
    var WHITESPACE = /\s+/g;
    // The other functions
    // may alter the DOM. So to prevent unprocessed DOM
    // or infinit loops, we process one element, then call the function
    // over until no other unprocessed elements are found.
    if (!msg_match({
        "dom-change": true
    }, msg)) return;
    var selector = '*[data-do]:not(*[data-do_done~="yes"])';
    var elements = $('*[data-do]:not(*[data-do_done~="yes"]):first');
    if (length(elements) === 0) return;
    var raw_e = elements[0];
    $(raw_e).attr("data-do_done", "yes");
    eachs(split_on(";", $(raw_e).attr("data-do")), function(_i, raw_cmd) {
        var args = split_on(WHITESPACE, raw_cmd);
        if (is_empty(args)) throw new Error("Invalid command: " + to_string(raw_cmd));
        var func_name = args.shift();
        var func = name_to_function(func_name);
        apply_function(func, [ {
            on_dom: true,
            dom_id: dom_id($(raw_e)),
            args: args.slice(0)
        } ]);
        return;
    });
    process_data_dos(msg);
    return true;
});
//# sourceMappingURL=build/browser.js.map