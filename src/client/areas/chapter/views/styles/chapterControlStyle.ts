import * as mio from '../../';

// [Improvement] Colors should be inherited from the theme.
export const chapterControlStyle = {
  primaryButton: mio.withStyle({
    marginLeft: -20,
    marginRight: 20,
  }),
  menuPaper: mio.withStyle({
    maxHeight: 216,
    width: 200
  }),
  chapterSelect: mio.withStyle({
    color: '#fafafa',
    flex: 1,
    margin: 8,
    marginLeft: 0,
    minWidth: 20
  }),
  pageSelect: mio.withStyle({
    color: '#fafafa',
    flex: 1,
    margin: 8,
    minWidth: 20
  }),
  directionSelect: mio.withStyle({
    color: '#fafafa',
    flex: 1,
    margin: 8,
    marginRight: -12,
    minWidth: 20
  })
};
