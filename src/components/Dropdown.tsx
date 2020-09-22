import React, { useEffect, useState } from 'react';
import { createStyles, makeStyles, useTheme, Theme } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Chip from '@material-ui/core/Chip';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

import { Provider, useQuery, useSubscription, Client, dedupExchange, fetchExchange, subscriptionExchange } from 'urql';

const subscriptionClient = new SubscriptionClient('ws://react.eogresources.com/graphql', {
  reconnect: true,
  connectionParams: {},
});
const client = new Client({
  url: 'https://react.eogresources.com/graphql',
  exchanges: [
    dedupExchange,
    fetchExchange,
    subscriptionExchange({
      forwardSubscription: (operation) => subscriptionClient.request(operation),
    }),
  ],
});

const metricsQuery = `
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

const getMultipleMeasurementsQuery = `
query ($input: [MeasurementQuery]){
    getMultipleMeasurements(input: $input){
      metric
      measurements{
        at
        value
        unit
      }
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
    query: metricsQuery,
  });
  const { fetching, data, error } = result;
  const metricses = !fetching ? data.getMetrics : null;
  return metricses;
}

function GetMultipleMeasurements(selectedMetrics: any, timestamp: any) {
  const input = selectedMetrics.map((metrics: any) => {
    return {
      metricName: metrics,
      after: timestamp,
    };
  });

  const [result] = useQuery({
    query: getMultipleMeasurementsQuery,
    variables: {
      input,
    },
  });

  const { fetching, data, error } = result;
  console.log(data);
  // console.log(error);
  const multipleMeasures = !fetching ? data.getMultipleMeasurements : null;
  return multipleMeasures;
}

function GetUpdate() {
  const [update] = useSubscription({ query: NEW_METRICS_SUBSCRIPTION });
  const { fetching, data, error } = update;
  const newMeasurement = !data ? null : data.newMeasurement;
  return newMeasurement;
}

const Dropdown = () => {
  const classes = useStyles();
  const theme = useTheme();
  const [personMetrics, setPersonMetrics] = React.useState<string[]>([]);
  const timestamp = React.useRef<number>(Date.now() - 1000 * 60 * 30);

  const newMeasurements = React.useRef<any>([]);

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPersonMetrics(event.target.value as string[]);
  };

  const metricses = GetMetrics();
  const newMeasurement = GetUpdate();
  const multipleMeasures = GetMultipleMeasurements(personMetrics, timestamp.current);

  if (newMeasurement) {
    newMeasurements.current = [
      ...newMeasurements.current.filter((m: any) => {
        return m.metric !== newMeasurement.metric;
      }),
      newMeasurement,
    ];
  }

  const LineChart = () => {
    const series = multipleMeasures
      ? multipleMeasures
          .filter((measurement: any) => {
            const { metric } = measurement;
            return personMetrics.includes(metric);
          })
          .map((measurement: any) => {
            const { metric, measurements } = measurement;
            return {
              name: metric,
              data: measurements.map((e: any) => {
                const { value, at } = e;
                return { x: at, y: value };
              }),
              turboThreshold: 10000,
            };
          })
      : null;

    const chartOptions: Highcharts.Options = {
      xAxis: {
        type: 'datetime',
      },
      chart: {
        animation: false,
      },
      series,
      plotOptions: {
        series: {
          animation: false,
        },
      },
    };

    return <HighchartsReact highcharts={Highcharts} options={chartOptions} />;
  };

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
            renderValue={(selected) => (
              <div className={classes.showTags}>
                {(selected as string[]).map((value) => (
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
        <div>
          {newMeasurements.current
            .filter((newMeasurement: any) => {
              const { metric } = newMeasurement;
              return personMetrics.includes(metric);
            })
            .map((newMeasurement: any) => {
              const { metric, value } = newMeasurement;
              return <p key={metric}>{`${metric}: ${value}`}</p>;
            })}
        </div>
        <>
          <LineChart />
        </>
      </div>
    </>
  );
};
