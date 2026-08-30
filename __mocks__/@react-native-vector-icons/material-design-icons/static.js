// Manual mock for the icon font component — Jest picks this up
// automatically for `@react-native-vector-icons/material-design-icons/static`
// so tests don't have to load the real (native-font-backed) module.
//
// It renders the glyph name as plain text, which is enough for tests to
// assert *which* icon a control shows. See src/components/Icon.tsx.
const React = require('react');
const { Text } = require('react-native');

function MaterialDesignIcons({ name, size, color, ...props }) {
  return React.createElement(
    Text,
    { ...props, style: { fontSize: size, color } },
    name,
  );
}

module.exports = {
  __esModule: true,
  MaterialDesignIcons,
  default: MaterialDesignIcons,
};
