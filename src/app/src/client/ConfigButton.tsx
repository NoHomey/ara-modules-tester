import * as React from 'react';
import { TouchTapEventHandler } from 'material-ui';
import RaisedButton from 'material-ui/RaisedButton';
import ActionSettings from 'material-ui/svg-icons/action/settings';
import {fullWhite} from 'material-ui/styles/colors';

interface ConfigButtonProps {
    onTouchTap: TouchTapEventHandler;
    style?: React.CSSProperties;
}

export default class ConfigButton extends React.Component<ConfigButtonProps, {}> {
    public render(): JSX.Element {
        return <RaisedButton
            style={this.props.style}
            label="Config"
            labelPosition="before"
            primary={true}
            icon={<ActionSettings color={fullWhite} />}
            onTouchTap={this.props.onTouchTap} />;
    }
};