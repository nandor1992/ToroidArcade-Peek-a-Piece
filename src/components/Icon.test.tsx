/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Icon, type IconName } from './Icon';

const NAMES: IconName[] = [
  'back',
  'home',
  'previous',
  'next',
  'reset',
  'parents',
  'settings',
  'volumeOn',
  'volumeOff',
  'close',
  'check',
];

test('maps semantic names to Material Design Icons glyphs', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    tree = ReactTestRenderer.create(
      <>
        {NAMES.map(name => (
          <Icon key={name} name={name} />
        ))}
      </>,
    );
  });

  // The manual mock renders the underlying glyph name as its text child.
  const glyphs = tree!.root
    .findAll(n => n.props != null && typeof n.props.children === 'string')
    .map(n => n.props.children as string)
    // Each mock <Text> shows up as a composite + host instance; keep one.
    .filter((_, i) => i % 2 === 0);

  expect(glyphs).toEqual([
    'chevron-left', // back
    'home',
    'chevron-left', // previous
    'chevron-right', // next
    'restart', // reset
    'account-supervisor',
    'cog',
    'volume-high',
    'volume-off',
    'close',
    'check-bold', // check
  ]);
});
