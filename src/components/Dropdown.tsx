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
// import { client, metricses } from '../API/MetricsAPI';

import { SubscriptionClient } from 'subscriptions-transport-ws';

import {
  Provider,
  createClient,
  useQuery,
  useSubscription,
  Client,
  dedupExchange,
  fetchExchange,
  subscriptionExchange,
} from 'urql';

const subscriptionClient = new SubscriptionClient('ws://react.eogresources.com/graphql', {
  reconnect: true,
  connectionParams: {
    // authToken: getToken(),
  },
});
const client = new Client({
  url: 'https://react.eogresources.com/graphql',
  exchanges: [
    dedupExchange,
    fetchExchange,
    subscriptionExchange({
      forwardSubscription: operation => subscriptionClient.request(operation),
    }),
  ],
});

const query = `
query{
	getMetrics
}
`;

const NEW_METRICS_SUBSCRIPTION = `
    subscription {
      newMeasurement {
        value
        at
        metric
        unit
      }
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
function GetMetrics() {
  const [result] = useQuery({
    query,
  });
  const { fetching, data, error } = result;
  const metricses = !fetching ? data.getMetrics : null;
  return metricses;
}

function GetUpdate() {
  const [update] = useSubscription({ query: NEW_METRICS_SUBSCRIPTION });
  const { fetching, data, error } = update;
  const newMeasurement = !data ? null : data.newMeasurement;
  console.log(newMeasurement);
  return newMeasurement;
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
  const metricses = GetMetrics();
  GetUpdate();
  // const newMeasurement = GetUpdate();
  // console.log(newMeasurement);
  return (
    <>
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
      <div>
        <h1>{personMetrics}</h1>
      </div>
    </>
  );
};
