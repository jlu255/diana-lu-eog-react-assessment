import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { createStyles, makeStyles, useTheme, Theme } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import ListItemText from '@material-ui/core/ListItemText';
import Select from '@material-ui/core/Select';
import Chip from '@material-ui/core/Chip';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { render } from 'react-dom';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

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
import { AnyARecord } from 'dns';

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
query{
    getMultipleMeasurements(input:[{metricName: "flareTemp", after:1600708142403 },{metricName:  "casingPressure", after:1600708142403},
    {metricName:  "injValveOpen",after:1600708142403}, {metricName:  "oilTemp",after:1600708142403},{metricName:"tubingPressure",after:1600708142403},
    {metricName:"waterTemp",after:1600708142403}]){
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

function GetMultipleMeasurements() {
  const [result] = useQuery({
    query: getMultipleMeasurementsQuery,
  });
  const { fetching, data, error } = result;
  // console.log(data);
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

  const newMeasurements = React.useRef<any>([]);

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPersonMetrics(event.target.value as string[]);
  };

  const metricses = GetMetrics();
  const newMeasurement = GetUpdate();
  const multipleMeasures = GetMultipleMeasurements();

  if (newMeasurement) {
    // console.log(newMeasurement);
    newMeasurements.current = [
      ...newMeasurements.current.filter((m: any) => {
        return m.metric !== newMeasurement.metric;
      }),
      newMeasurement,
    ];
    // console.log(newMeasurements.current);
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
              turboThreshold: 5000,
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
