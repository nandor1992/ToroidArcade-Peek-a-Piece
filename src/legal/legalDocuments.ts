/**
 * The legal documents shown inside the app, as plain data.
 *
 * They are bundled rather than linked because the app makes no network
 * requests at all (see docs/architecture.md) — a parent on a plane with no
 * signal still has to be able to read what the app promises about their
 * children's photos. The hosted copies under `docs/legal/` are the canonical,
 * full-length versions; these are the same commitments, tightened for reading
 * on a phone.
 *
 * **Keep the two in sync by hand.** There's no build step wiring them
 * together, the same way `ABOUT_INFO.version` tracks package.json by hand.
 * See docs/specs/legal/legalDocuments.md.
 */

/** The contact address, and the date these documents took effect. */
export const LEGAL_CONTACT = 'PLACEHOLDER_CONTACT_EMAIL';
export const LEGAL_EFFECTIVE_DATE = 'PLACEHOLDER_DATE';

/** Where the full-length versions live, for the footer of each document. */
export const LEGAL_DOCS_URL =
  'https://github.com/nandor1992/ToroidArcade-Peek-a-Piece/tree/master/docs/legal';

/** One run of text under an optional heading. */
export interface LegalBlock {
  heading?: string;
  /** Body paragraphs, rendered one after another. */
  text?: string[];
  /** Bulleted points, rendered after `text`. */
  bullets?: string[];
}

export interface LegalDocument {
  id: 'privacy' | 'terms' | 'copyright';
  /** Short label for the button that opens it. */
  label: string;
  /** Heading shown at the top of the document itself. */
  title: string;
  blocks: LegalBlock[];
}

const PRIVACY: LegalDocument = {
  id: 'privacy',
  label: 'Privacy',
  title: 'Privacy Policy',
  blocks: [
    {
      text: [
        'Peek-a-Piece does not collect, transmit, or share any personal information from anyone — children or adults.',
      ],
    },
    {
      heading: 'What the app stores',
      text: [
        'Photos you add are copied into the app’s private storage on this device. Which puzzles have been finished is saved on this device too. Volume, timer, and size settings last for the current session only.',
        'None of it leaves the device. It is never uploaded, backed up to a server, or sent to us or to anyone else.',
      ],
    },
    {
      heading: 'What the app does not do',
      bullets: [
        'No accounts and no sign-in.',
        'No analytics, telemetry, or usage tracking.',
        'No advertising and no ad networks.',
        'No third-party SDKs that collect data.',
        'No location, microphone, or camera use.',
        'No selling or sharing of data — there is none to sell or share.',
      ],
    },
    {
      heading: 'Children’s privacy',
      text: [
        'The app is made for young children and set up by a grown-up. Because it collects no personal information from anyone, it meets COPPA in the United States, the UK Age-Appropriate Design Code, and the GDPR, including its provisions for children.',
        'Adding photos and changing settings sit behind the parent gate so a child cannot do either alone.',
      ],
    },
    {
      heading: 'Photos',
      text: [
        'Photos are chosen through your device’s own photo picker. The app receives only the images you pick, and never asks for access to the rest of your library.',
      ],
    },
    {
      heading: 'Deleting your data',
      text: [
        'Delete a single photo in the parent area to remove its file from the device. Uninstall the app to remove everything. We hold no copies, so there is nothing for us to delete at our end.',
      ],
    },
  ],
};

const TERMS: LegalDocument = {
  id: 'terms',
  label: 'Terms of Use',
  title: 'Terms of Use',
  blocks: [
    {
      text: [
        'Peek-a-Piece is free, and made by ToroidSystems / ToroidArcade. These terms are between us and the adult who installs and sets up the app. Using the app means accepting them.',
      ],
    },
    {
      heading: 'Using the app',
      text: [
        'You may install and use the app on devices you own or control, for your own family’s non-commercial use. You may not sell, rent, or redistribute it, or remove its copyright and attribution notices.',
        'These terms cover the app as you installed it. They are not the licence on the source code — that is published separately under the MIT Licence, which is what applies if you are working from the source.',
      ],
    },
    {
      heading: 'Your photos stay yours',
      text: [
        'We claim no ownership of and no licence over any photo you add — and we never receive a copy.',
        'By adding a photo you confirm you have the right to use it, and that anyone recognisable in it (or their parent or guardian) would be comfortable with it.',
      ],
    },
    {
      heading: 'Nothing is backed up',
      text: [
        'This is the trade-off that makes the app private, so it is worth being blunt: everything lives only on this device. Uninstalling the app, clearing its data, or losing the device permanently deletes your photos and progress, and we cannot recover any of it — because we never had it.',
        'Keep your original photos somewhere else. Treat what is in the app as a copy, never as your only one.',
      ],
    },
    {
      heading: 'Supervision is yours',
      text: [
        'The app cannot reach the internet, spend money, or let a child talk to anyone. The parent area sits behind an arithmetic gate — but that gate is a speed bump, not a security control. It keeps a three-year-old out; it will not stop an older child who can add up.',
        'The session timer is a convenience for winding play down, not a child-safety feature.',
      ],
    },
    {
      heading: 'As-is, and liability',
      text: [
        'The app is provided “as is”, without warranty of any kind. We are not liable for indirect or consequential loss, including lost photos or progress.',
        'Nothing here limits liability that cannot lawfully be limited, and your legal rights as a consumer are unaffected.',
      ],
    },
    {
      heading: 'Changes',
      text: [
        'We may update or discontinue the app at any time. Material changes to these terms ship with a new app version and are posted with a new effective date.',
      ],
    },
  ],
};

const COPYRIGHT: LegalDocument = {
  id: 'copyright',
  label: 'Copyright',
  title: 'Copyright & Licences',
  blocks: [
    {
      text: [
        'Peek-a-Piece © 2026 ToroidSystems / ToroidArcade.',
        'The source code is open source under the MIT Licence, published so anyone can check the privacy claims for themselves rather than taking our word for it.',
        'The code licence does not cover the starter pictures (all rights reserved), the music (its own licence), or the Peek-a-Piece name and logo.',
      ],
    },
    {
      heading: 'Your photos',
      text: [
        'Photos you add stay yours. We claim no ownership and no licence over them.',
      ],
    },
    {
      heading: 'Starter pictures',
      text: [
        'The illustrated starter puzzles are cartoon renders of the developer’s own family photos, made with imagetocartoon.com. All rights reserved — they ship so the app has something to show on first run, and are not licensed for reuse elsewhere.',
      ],
    },
    {
      heading: 'Music',
      text: [
        '“Children” by Dmitrii Kolesnikov, from Pixabay, used under the Pixabay Content License.',
      ],
    },
    {
      heading: 'Icons',
      text: [
        'Material Design Icons by the Pictogrammers community, under the Apache License 2.0, delivered through @react-native-vector-icons/material-design-icons (MIT, © 2015 Joel Arvidsson).',
      ],
    },
    {
      heading: 'Open-source software',
      text: [
        'Peek-a-Piece is built on open-source software, each component remaining the copyright of its authors:',
      ],
      bullets: [
        'React and React Native — MIT, © Meta Platforms, Inc. and affiliates',
        'React Native for Web — MIT, © Nicolas Gallagher',
        '@shopify/react-native-skia — MIT, © Shopify Inc.',
        'Skia Graphics Library — BSD 3-Clause, © Google LLC',
        'react-native-sound, react-native-image-picker, react-native-safe-area-context, @react-native-async-storage/async-storage, @dr.pogodin/react-native-fs — MIT',
      ],
    },
    {
      heading: 'Trademarks',
      text: [
        'Android and Google Play are trademarks of Google LLC. Apple and App Store are trademarks of Apple Inc. Named here for attribution only — no affiliation or endorsement is implied.',
      ],
    },
  ],
};

/** In the order they appear in the About sheet. */
export const LEGAL_DOCUMENTS: LegalDocument[] = [PRIVACY, TERMS, COPYRIGHT];

/** The one-line notice shown in the About sheet itself. */
export const COPYRIGHT_LINE = '© 2026 ToroidSystems / ToroidArcade';
