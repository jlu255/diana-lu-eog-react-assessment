import React, { useEffect } from 'react';
import clsx from 'clsx';
import { createStyles, makeStyles, useTheme, Theme } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import ListItemText from '@material-ui/core/ListItemText';
import Select from '@material-ui/core/Select';
import Chip from '@material-ui/core/Chip';
import { Provider, createClient, useQuery, Client, dedupExchange, fetchExchange, subscriptionExchange } from 'urql';

import { SubscriptionClient } from 'subscription-transport-ws';
const subscriptionClient = new SubscriptionClient('https://react.eogresources.com/graphql', {
  reconnect: true,
  //   connectionParams: {
  //     authToken: getToken(),
  //   },
});
const client = createClient({
  url: 'https://react.eogresources.com/graphql',
});

const query = `
query{
	getMetrics
}
`;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formControl: {
      margin: theme.spacing(1),
      minWidth: 120,
      maxWidth: 300,
    },
    showTags: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    showTag: {
      margin: 2,
    },
    noLabel: {
      marginTop: theme.spacing(3),
    },
  }),
);
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default () => {
  return (
    <Provider value={client}>
      <Dropdown />
    </Provider>
  );
};

function getStyles(metrics: string, personMetrics: string[], theme: Theme) {
  return {
    fontWeight:
      personMetrics.indexOf(metrics) === -1 ? theme.typography.fontWeightRegular : theme.typography.fontWeightMedium,
  };
}

const Dropdown = () => {
  const classes = useStyles();
  const theme = useTheme();
  const [personMetrics, setPersonMetrics] = React.useState<string[]>([]);

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPersonMetrics(event.target.value as string[]);
  };

  const handleChangeMultiple = (event: React.ChangeEvent<{ value: unknown }>) => {
    const { options } = event.target as HTMLSelectElement;
    const value: string[] = [];
    for (let i = 0, l = options.length; i < l; i += 1) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    setPersonMetrics(value);
  };

  const [result] = useQuery({
    query,
  });
  const { fetching, data, error } = result;
  const metricses = !fetching ? data.getMetrics : null;

  return (
    <div>
      <FormControl className={classes.formControl}>
        <InputLabel id="demo-mutiple-chip-label">ShowTags</InputLabel>
        <Select
          labelId="demo-mutiple-chip-label"
          id="demo-mutiple-chip"
          multiple
          value={personMetrics}
          onChange={handleChange}
          input={<Input id="select-multiple-chip" />}
          renderValue={selected => (
            <div className={classes.showTags}>
              {(selected as string[]).map(value => (
                <Chip key={value} label={value} className={classes.showTag} />
              ))}
            </div>
          )}
          MenuProps={MenuProps}
        >
          {metricses &&
            metricses.map((metrics: any) => (
              <MenuItem key={metrics} value={metrics} style={getStyles(metrics, personMetrics, theme)}>
                {metrics}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    </div>
  );
};
