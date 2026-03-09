/**
 * Mock for @react-pdf/renderer — provides all exports used by the PDF template engine.
 * React-PDF components are stubbed as simple functions that return their children.
 */

const React = require("react");

// PDF primitives — render as simple divs/spans for testing
const Document = (props) => React.createElement("div", { "data-testid": "pdf-document" }, props.children);
const Page = (props) => React.createElement("div", { "data-testid": "pdf-page" }, props.children);
const View = (props) => React.createElement("div", null, props.children);
const Text = (props) => {
  if (typeof props.render === "function") {
    return React.createElement("span", null, props.render({ pageNumber: 1, totalPages: 1 }));
  }
  return React.createElement("span", null, props.children);
};
const Image = (props) => React.createElement("img", { src: props.src });
const Link = (props) => React.createElement("a", { href: props.src }, props.children);

// StyleSheet.create just returns the object
const StyleSheet = {
  create: (styles) => styles,
};

// Font registration — no-op
const Font = {
  register: () => {},
  getRegisteredFonts: () => [],
};

// renderToBuffer — returns a mock buffer
const renderToBuffer = async () => Buffer.from("%PDF-1.4 mock");

module.exports = {
  Document,
  Page,
  View,
  Text,
  Image,
  Link,
  StyleSheet,
  Font,
  renderToBuffer,
};
