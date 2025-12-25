var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
function noop() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return /* @__PURE__ */ Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || a && typeof a === "object" || typeof a === "function";
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function append(target, node) {
  target.appendChild(node);
}
function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}
function detach(node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
}
function destroy_each(iterations, detaching) {
  for (let i = 0; i < iterations.length; i += 1) {
    if (iterations[i]) iterations[i].d(detaching);
  }
}
function element(name) {
  return document.createElement(name);
}
function svg_element(name) {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}
function text(data) {
  return document.createTextNode(data);
}
function space() {
  return text(" ");
}
function listen(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
  if (value == null) node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function set_data(text2, data) {
  data = "" + data;
  if (text2.data === data) return;
  text2.data = /** @type {string} */
  data;
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component) throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
const dirty_components = [];
const binding_callbacks = [];
let render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = /* @__PURE__ */ Promise.resolve();
let update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
const seen_callbacks = /* @__PURE__ */ new Set();
let flushidx = 0;
function flush() {
  if (flushidx !== 0) {
    return;
  }
  const saved_component = current_component;
  do {
    try {
      while (flushidx < dirty_components.length) {
        const component = dirty_components[flushidx];
        flushidx++;
        set_current_component(component);
        update(component.$$);
      }
    } catch (e) {
      dirty_components.length = 0;
      flushidx = 0;
      throw e;
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length) binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
function flush_render_callbacks(fns) {
  const filtered = [];
  const targets = [];
  render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
  targets.forEach((c) => c());
  render_callbacks = filtered;
}
const outroing = /* @__PURE__ */ new Set();
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
function ensure_array_like(array_like_or_iterator) {
  return (array_like_or_iterator == null ? void 0 : array_like_or_iterator.length) !== void 0 ? array_like_or_iterator : Array.from(array_like_or_iterator);
}
function destroy_block(block, lookup) {
  block.d(1);
  lookup.delete(block.key);
}
function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block2, next, get_context) {
  let o = old_blocks.length;
  let n = list.length;
  let i = o;
  const old_indexes = {};
  while (i--) old_indexes[old_blocks[i].key] = i;
  const new_blocks = [];
  const new_lookup = /* @__PURE__ */ new Map();
  const deltas = /* @__PURE__ */ new Map();
  const updates = [];
  i = n;
  while (i--) {
    const child_ctx = get_context(ctx, list, i);
    const key = get_key(child_ctx);
    let block = lookup.get(key);
    if (!block) {
      block = create_each_block2(key, child_ctx);
      block.c();
    } else {
      updates.push(() => block.p(child_ctx, dirty));
    }
    new_lookup.set(key, new_blocks[i] = block);
    if (key in old_indexes) deltas.set(key, Math.abs(i - old_indexes[key]));
  }
  const will_move = /* @__PURE__ */ new Set();
  const did_move = /* @__PURE__ */ new Set();
  function insert2(block) {
    transition_in(block, 1);
    block.m(node, next);
    lookup.set(block.key, block);
    next = block.first;
    n--;
  }
  while (o && n) {
    const new_block = new_blocks[n - 1];
    const old_block = old_blocks[o - 1];
    const new_key = new_block.key;
    const old_key = old_block.key;
    if (new_block === old_block) {
      next = new_block.first;
      o--;
      n--;
    } else if (!new_lookup.has(old_key)) {
      destroy(old_block, lookup);
      o--;
    } else if (!lookup.has(new_key) || will_move.has(new_key)) {
      insert2(new_block);
    } else if (did_move.has(old_key)) {
      o--;
    } else if (deltas.get(new_key) > deltas.get(old_key)) {
      did_move.add(new_key);
      insert2(new_block);
    } else {
      will_move.add(old_key);
      o--;
    }
  }
  while (o--) {
    const old_block = old_blocks[o];
    if (!new_lookup.has(old_block.key)) destroy(old_block, lookup);
  }
  while (n) insert2(new_blocks[n - 1]);
  run_all(updates);
  return new_blocks;
}
function mount_component(component, target, anchor) {
  const { fragment, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  add_render_callback(() => {
    const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
    if (component.$$.on_destroy) {
      component.$$.on_destroy.push(...new_on_destroy);
    } else {
      run_all(new_on_destroy);
    }
    component.$$.on_mount = [];
  });
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    flush_render_callbacks($$.after_update);
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function init(component, options, instance2, create_fragment2, not_equal, props, append_styles = null, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: [],
    // state
    props,
    update: noop,
    not_equal,
    bound: blank_object(),
    // lifecycle
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    // everything else
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles && append_styles($$.root);
  let ready = false;
  $$.ctx = instance2 ? instance2(component, options.props || {}, (i, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
      if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
      if (ready) make_dirty(component, i);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment2 ? create_fragment2($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro) transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor);
    flush();
  }
  set_current_component(parent_component);
}
class SvelteComponent {
  constructor() {
    /**
     * ### PRIVATE API
     *
     * Do not use, may change at any time
     *
     * @type {any}
     */
    __publicField(this, "$$");
    /**
     * ### PRIVATE API
     *
     * Do not use, may change at any time
     *
     * @type {any}
     */
    __publicField(this, "$$set");
  }
  /** @returns {void} */
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop;
  }
  /**
   * @template {Extract<keyof Events, string>} K
   * @param {K} type
   * @param {((e: Events[K]) => void) | null | undefined} callback
   * @returns {() => void}
   */
  $on(type, callback) {
    if (!is_function(callback)) {
      return noop;
    }
    const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks.push(callback);
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1) callbacks.splice(index, 1);
    };
  }
  /**
   * @param {Partial<Props>} props
   * @returns {void}
   */
  $set(props) {
    if (this.$$set && !is_empty(props)) {
      this.$$.skip_bound = true;
      this.$$set(props);
      this.$$.skip_bound = false;
    }
  }
}
const PUBLIC_VERSION = "4";
if (typeof window !== "undefined")
  (window.__svelte || (window.__svelte = { v: /* @__PURE__ */ new Set() })).v.add(PUBLIC_VERSION);
function get_each_context_1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[18] = list[i];
  return child_ctx;
}
function get_each_context_2(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[21] = list[i];
  return child_ctx;
}
function get_each_context(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[15] = list[i];
  child_ctx[17] = i;
  return child_ctx;
}
function create_else_block_2(ctx) {
  let div;
  let h2;
  let t1;
  let t2;
  let button;
  let mounted;
  let dispose;
  function select_block_type_3(ctx2, dirty) {
    if (!/*results*/
    ctx2[2].groupedByFrequency || /*results*/
    ctx2[2].groupedByFrequency.length === 0) return create_if_block_5;
    return create_else_block_3;
  }
  let current_block_type = select_block_type_3(ctx);
  let if_block = current_block_type(ctx);
  return {
    c() {
      div = element("div");
      h2 = element("h2");
      h2.textContent = "Sellers Found";
      t1 = space();
      if_block.c();
      t2 = space();
      button = element("button");
      button.innerHTML = `<svg viewBox="0 0 24 24" class="svelte-8blj65"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
          Back to Search`;
      attr(h2, "class", "svelte-8blj65");
      attr(button, "class", "back-btn svelte-8blj65");
      attr(div, "class", "results svelte-8blj65");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, h2);
      append(div, t1);
      if_block.m(div, null);
      append(div, t2);
      append(div, button);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_2*/
          ctx[13]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type_3(ctx2)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(div, t2);
        }
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      if_block.d();
      mounted = false;
      dispose();
    }
  };
}
function create_if_block(ctx) {
  let div0;
  let each_blocks = [];
  let each_1_lookup = /* @__PURE__ */ new Map();
  let t0;
  let t1;
  let div1;
  let button;
  let mounted;
  let dispose;
  let each_value = ensure_array_like(
    /*products*/
    ctx[0]
  );
  const get_key = (ctx2) => (
    /*product*/
    ctx2[15].id
  );
  for (let i = 0; i < each_value.length; i += 1) {
    let child_ctx = get_each_context(ctx, each_value, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
  }
  let if_block0 = (
    /*error*/
    ctx[3] && create_if_block_2(ctx)
  );
  function select_block_type_2(ctx2, dirty) {
    if (
      /*isLoading*/
      ctx2[1]
    ) return create_if_block_1;
    return create_else_block;
  }
  let current_block_type = select_block_type_2(ctx);
  let if_block1 = current_block_type(ctx);
  return {
    c() {
      div0 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t0 = space();
      if (if_block0) if_block0.c();
      t1 = space();
      div1 = element("div");
      button = element("button");
      if_block1.c();
      attr(div0, "class", "product-list svelte-8blj65");
      attr(button, "class", "find-btn svelte-8blj65");
      button.disabled = /*isLoading*/
      ctx[1];
      attr(div1, "class", "actions svelte-8blj65");
    },
    m(target, anchor) {
      insert(target, div0, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div0, null);
        }
      }
      insert(target, t0, anchor);
      if (if_block0) if_block0.m(target, anchor);
      insert(target, t1, anchor);
      insert(target, div1, anchor);
      append(div1, button);
      if_block1.m(button, null);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*findCommonSellers*/
          ctx[8]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & /*removeProduct, products, addProduct, updateProduct, handleKeyPress*/
      241) {
        each_value = ensure_array_like(
          /*products*/
          ctx2[0]
        );
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value, each_1_lookup, div0, destroy_block, create_each_block, null, get_each_context);
      }
      if (
        /*error*/
        ctx2[3]
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_2(ctx2);
          if_block0.c();
          if_block0.m(t1.parentNode, t1);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (current_block_type !== (current_block_type = select_block_type_2(ctx2))) {
        if_block1.d(1);
        if_block1 = current_block_type(ctx2);
        if (if_block1) {
          if_block1.c();
          if_block1.m(button, null);
        }
      }
      if (dirty & /*isLoading*/
      2) {
        button.disabled = /*isLoading*/
        ctx2[1];
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div0);
        detach(t0);
        detach(t1);
        detach(div1);
      }
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
      if (if_block0) if_block0.d(detaching);
      if_block1.d();
      mounted = false;
      dispose();
    }
  };
}
function create_else_block_3(ctx) {
  let div;
  let each_value_1 = ensure_array_like(
    /*results*/
    ctx[2].groupedByFrequency
  );
  let each_blocks = [];
  for (let i = 0; i < each_value_1.length; i += 1) {
    each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
  }
  return {
    c() {
      div = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      attr(div, "class", "grouped-sellers svelte-8blj65");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div, null);
        }
      }
    },
    p(ctx2, dirty) {
      if (dirty & /*results*/
      4) {
        each_value_1 = ensure_array_like(
          /*results*/
          ctx2[2].groupedByFrequency
        );
        let i;
        for (i = 0; i < each_value_1.length; i += 1) {
          const child_ctx = get_each_context_1(ctx2, each_value_1, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block_1(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div, null);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value_1.length;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      destroy_each(each_blocks, detaching);
    }
  };
}
function create_if_block_5(ctx) {
  let p;
  return {
    c() {
      p = element("p");
      p.textContent = "No sellers found.";
      attr(p, "class", "no-results svelte-8blj65");
    },
    m(target, anchor) {
      insert(target, p, anchor);
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(p);
      }
    }
  };
}
function create_else_block_4(ctx) {
  let span;
  let t0_value = (
    /*group*/
    ctx[18].frequency + ""
  );
  let t0;
  let t1;
  let t2_value = (
    /*group*/
    ctx[18].totalProducts + ""
  );
  let t2;
  let t3;
  return {
    c() {
      span = element("span");
      t0 = text(t0_value);
      t1 = text(" of ");
      t2 = text(t2_value);
      t3 = text(" products");
      attr(span, "class", "badge svelte-8blj65");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t0);
      append(span, t1);
      append(span, t2);
      append(span, t3);
    },
    p(ctx2, dirty) {
      if (dirty & /*results*/
      4 && t0_value !== (t0_value = /*group*/
      ctx2[18].frequency + "")) set_data(t0, t0_value);
      if (dirty & /*results*/
      4 && t2_value !== (t2_value = /*group*/
      ctx2[18].totalProducts + "")) set_data(t2, t2_value);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
    }
  };
}
function create_if_block_6(ctx) {
  let span;
  let t0;
  let t1_value = (
    /*group*/
    ctx[18].totalProducts + ""
  );
  let t1;
  let t2;
  return {
    c() {
      span = element("span");
      t0 = text("All ");
      t1 = text(t1_value);
      t2 = text(" products");
      attr(span, "class", "badge badge-perfect svelte-8blj65");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t0);
      append(span, t1);
      append(span, t2);
    },
    p(ctx2, dirty) {
      if (dirty & /*results*/
      4 && t1_value !== (t1_value = /*group*/
      ctx2[18].totalProducts + "")) set_data(t1, t1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
    }
  };
}
function create_each_block_2(ctx) {
  let a;
  let t0_value = (
    /*seller*/
    ctx[21].name + ""
  );
  let t0;
  let t1;
  let svg;
  let path;
  let t2;
  let a_href_value;
  return {
    c() {
      a = element("a");
      t0 = text(t0_value);
      t1 = space();
      svg = svg_element("svg");
      path = svg_element("path");
      t2 = space();
      attr(path, "d", "M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z");
      attr(svg, "class", "external-icon svelte-8blj65");
      attr(svg, "viewBox", "0 0 24 24");
      attr(a, "href", a_href_value = /*seller*/
      ctx[21].url);
      attr(a, "target", "_blank");
      attr(a, "class", "seller-link svelte-8blj65");
    },
    m(target, anchor) {
      insert(target, a, anchor);
      append(a, t0);
      append(a, t1);
      append(a, svg);
      append(svg, path);
      append(a, t2);
    },
    p(ctx2, dirty) {
      if (dirty & /*results*/
      4 && t0_value !== (t0_value = /*seller*/
      ctx2[21].name + "")) set_data(t0, t0_value);
      if (dirty & /*results*/
      4 && a_href_value !== (a_href_value = /*seller*/
      ctx2[21].url)) {
        attr(a, "href", a_href_value);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(a);
      }
    }
  };
}
function create_each_block_1(ctx) {
  let div2;
  let div0;
  let t0;
  let div1;
  let t1;
  function select_block_type_4(ctx2, dirty) {
    if (
      /*group*/
      ctx2[18].frequency === /*group*/
      ctx2[18].totalProducts
    ) return create_if_block_6;
    return create_else_block_4;
  }
  let current_block_type = select_block_type_4(ctx);
  let if_block = current_block_type(ctx);
  let each_value_2 = ensure_array_like(
    /*group*/
    ctx[18].sellers
  );
  let each_blocks = [];
  for (let i = 0; i < each_value_2.length; i += 1) {
    each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
  }
  return {
    c() {
      div2 = element("div");
      div0 = element("div");
      if_block.c();
      t0 = space();
      div1 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t1 = space();
      attr(div0, "class", "frequency-header svelte-8blj65");
      attr(div1, "class", "sellers-list svelte-8blj65");
      attr(div2, "class", "frequency-group svelte-8blj65");
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      append(div2, div0);
      if_block.m(div0, null);
      append(div2, t0);
      append(div2, div1);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div1, null);
        }
      }
      append(div2, t1);
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type_4(ctx2)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(div0, null);
        }
      }
      if (dirty & /*results*/
      4) {
        each_value_2 = ensure_array_like(
          /*group*/
          ctx2[18].sellers
        );
        let i;
        for (i = 0; i < each_value_2.length; i += 1) {
          const child_ctx = get_each_context_2(ctx2, each_value_2, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block_2(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div1, null);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value_2.length;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div2);
      }
      if_block.d();
      destroy_each(each_blocks, detaching);
    }
  };
}
function create_else_block_1(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      attr(div, "class", "icon-btn-placeholder svelte-8blj65");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_4(ctx) {
  let button;
  let mounted;
  let dispose;
  function click_handler_1() {
    return (
      /*click_handler_1*/
      ctx[12](
        /*index*/
        ctx[17]
      )
    );
  }
  return {
    c() {
      button = element("button");
      button.innerHTML = `<svg viewBox="0 0 24 24" class="svelte-8blj65"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"></path></svg>`;
      attr(button, "class", "icon-btn add-btn svelte-8blj65");
      attr(button, "title", "Add");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(button, "click", click_handler_1);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_3(ctx) {
  let button;
  let mounted;
  let dispose;
  function click_handler() {
    return (
      /*click_handler*/
      ctx[11](
        /*index*/
        ctx[17]
      )
    );
  }
  return {
    c() {
      button = element("button");
      button.innerHTML = `<svg viewBox="0 0 24 24" class="svelte-8blj65"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path></svg>`;
      attr(button, "class", "icon-btn remove-btn svelte-8blj65");
      attr(button, "title", "Remove");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(button, "click", click_handler);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_each_block(key_1, ctx) {
  let div;
  let input;
  let input_value_value;
  let input_disabled_value;
  let t0;
  let show_if;
  let t1;
  let mounted;
  let dispose;
  function input_handler(...args) {
    return (
      /*input_handler*/
      ctx[9](
        /*index*/
        ctx[17],
        ...args
      )
    );
  }
  function keypress_handler(...args) {
    return (
      /*keypress_handler*/
      ctx[10](
        /*index*/
        ctx[17],
        ...args
      )
    );
  }
  function select_block_type_1(ctx2, dirty) {
    if (dirty & /*products*/
    1) show_if = null;
    if (
      /*product*/
      ctx2[15].saved
    ) return create_if_block_3;
    if (show_if == null) show_if = !!/*product*/
    ctx2[15].url.trim();
    if (show_if) return create_if_block_4;
    return create_else_block_1;
  }
  let current_block_type = select_block_type_1(ctx, -1);
  let if_block = current_block_type(ctx);
  return {
    key: key_1,
    first: null,
    c() {
      div = element("div");
      input = element("input");
      t0 = space();
      if_block.c();
      t1 = space();
      attr(input, "type", "text");
      attr(input, "class", "product-input svelte-8blj65");
      attr(input, "placeholder", "Paste Allegro seller listing page URL...");
      input.value = input_value_value = /*product*/
      ctx[15].url;
      input.disabled = input_disabled_value = /*product*/
      ctx[15].saved;
      attr(div, "class", "product-item svelte-8blj65");
      this.first = div;
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, input);
      append(div, t0);
      if_block.m(div, null);
      append(div, t1);
      if (!mounted) {
        dispose = [
          listen(input, "input", input_handler),
          listen(input, "keypress", keypress_handler)
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty & /*products*/
      1 && input_value_value !== (input_value_value = /*product*/
      ctx[15].url) && input.value !== input_value_value) {
        input.value = input_value_value;
      }
      if (dirty & /*products*/
      1 && input_disabled_value !== (input_disabled_value = /*product*/
      ctx[15].saved)) {
        input.disabled = input_disabled_value;
      }
      if (current_block_type === (current_block_type = select_block_type_1(ctx, dirty)) && if_block) {
        if_block.p(ctx, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx);
        if (if_block) {
          if_block.c();
          if_block.m(div, t1);
        }
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      if_block.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_2(ctx) {
  let div;
  let t;
  return {
    c() {
      div = element("div");
      t = text(
        /*error*/
        ctx[3]
      );
      attr(div, "class", "error svelte-8blj65");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
    },
    p(ctx2, dirty) {
      if (dirty & /*error*/
      8) set_data(
        t,
        /*error*/
        ctx2[3]
      );
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_else_block(ctx) {
  let svg;
  let path;
  let t;
  return {
    c() {
      svg = svg_element("svg");
      path = svg_element("path");
      t = text("\n            Find Common Sellers");
      attr(path, "d", "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z");
      attr(svg, "class", "search-icon svelte-8blj65");
      attr(svg, "viewBox", "0 0 24 24");
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      append(svg, path);
      insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching) {
        detach(svg);
        detach(t);
      }
    }
  };
}
function create_if_block_1(ctx) {
  let span;
  let t;
  return {
    c() {
      span = element("span");
      t = text("\n            Searching...");
      attr(span, "class", "spinner svelte-8blj65");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
        detach(t);
      }
    }
  };
}
function create_fragment(ctx) {
  let div2;
  let div0;
  let t1;
  let div1;
  function select_block_type(ctx2, dirty) {
    if (!/*results*/
    ctx2[2]) return create_if_block;
    return create_else_block_2;
  }
  let current_block_type = select_block_type(ctx);
  let if_block = current_block_type(ctx);
  return {
    c() {
      div2 = element("div");
      div0 = element("div");
      div0.innerHTML = `<h1 class="svelte-8blj65">Allegro Seller Finder</h1>`;
      t1 = space();
      div1 = element("div");
      if_block.c();
      attr(div0, "class", "header svelte-8blj65");
      attr(div1, "class", "content svelte-8blj65");
      attr(div2, "class", "popup svelte-8blj65");
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      append(div2, div0);
      append(div2, t1);
      append(div2, div1);
      if_block.m(div1, null);
    },
    p(ctx2, [dirty]) {
      if (current_block_type === (current_block_type = select_block_type(ctx2)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(div1, null);
        }
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(div2);
      }
      if_block.d();
    }
  };
}
function isValidAllegroUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes("allegro.pl");
  } catch {
    return false;
  }
}
function instance($$self, $$props, $$invalidate) {
  let products = [
    {
      url: "",
      id: crypto.randomUUID(),
      saved: false
    }
  ];
  let isLoading = false;
  let results = null;
  let error = "";
  onMount(async () => {
    const stored = await chrome.storage.local.get(["products"]);
    if (stored.products && stored.products.length > 0) {
      $$invalidate(0, products = [
        ...stored.products.map((url) => ({
          url,
          id: crypto.randomUUID(),
          saved: true
        })),
        {
          url: "",
          id: crypto.randomUUID(),
          saved: false
        }
      ]);
    }
  });
  async function saveProducts() {
    const urls = products.filter((p) => p.saved).map((p) => p.url);
    await chrome.storage.local.set({ products: urls });
  }
  function addProduct(index) {
    if (!products[index].url.trim()) {
      $$invalidate(3, error = "Please enter a product URL");
      return;
    }
    if (!isValidAllegroUrl(products[index].url)) {
      $$invalidate(3, error = "Please enter a valid Allegro URL");
      return;
    }
    $$invalidate(3, error = "");
    $$invalidate(0, products[index].saved = true, products);
    $$invalidate(0, products = [
      ...products,
      {
        url: "",
        id: crypto.randomUUID(),
        saved: false
      }
    ]);
    saveProducts();
  }
  function removeProduct(index) {
    $$invalidate(0, products = products.filter((_, i) => i !== index));
    if (products.filter((p) => p.saved).length === 0) {
      $$invalidate(0, products = [
        {
          url: "",
          id: crypto.randomUUID(),
          saved: false
        }
      ]);
    }
    saveProducts();
  }
  function updateProduct(index, value) {
    $$invalidate(0, products[index].url = value, products);
    $$invalidate(3, error = "");
  }
  function handleKeyPress(event, index) {
    if (event.key === "Enter" && !products[index].saved) {
      addProduct(index);
    }
  }
  async function findCommonSellers() {
    $$invalidate(3, error = "");
    $$invalidate(2, results = null);
    const savedProducts = products.filter((p) => p.saved);
    if (savedProducts.length < 2) {
      $$invalidate(3, error = "Please add at least 2 product seller listing URLs");
      return;
    }
    $$invalidate(1, isLoading = true);
    try {
      const response = await chrome.runtime.sendMessage({
        action: "findCommonSellers",
        productUrls: savedProducts.map((p) => p.url)
      });
      if (response.error) {
        $$invalidate(3, error = response.error);
      } else {
        $$invalidate(2, results = response.results);
      }
    } catch (err) {
      $$invalidate(3, error = err.message || "An error occurred while searching");
    } finally {
      $$invalidate(1, isLoading = false);
    }
  }
  const input_handler = (index, e) => updateProduct(index, e.target.value);
  const keypress_handler = (index, e) => handleKeyPress(e, index);
  const click_handler = (index) => removeProduct(index);
  const click_handler_1 = (index) => addProduct(index);
  const click_handler_2 = () => $$invalidate(2, results = null);
  return [
    products,
    isLoading,
    results,
    error,
    addProduct,
    removeProduct,
    updateProduct,
    handleKeyPress,
    findCommonSellers,
    input_handler,
    keypress_handler,
    click_handler,
    click_handler_1,
    click_handler_2
  ];
}
class Popup extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, {});
  }
}
new Popup({
  target: document.getElementById("app")
});
//# sourceMappingURL=popup.js.map
