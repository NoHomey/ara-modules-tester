import * as React from 'react';
import AraTesterAxisService from './../../../../services/AraTesterAxisService';
import AraTesterAxisId from './../../../../../share/AraTesterAxisId';
import AraTesterAxisDistance from './../../../../../share/AraTesterAxisDistance';
import AraTesterAxisMovment from './../../../../../share/AraTesterAxisMovment';
import { default as MovmentButton, SyntheticEventHandler, MovmentButtonProps } from './../../../MovmentButton';

export interface AraTesterAutoMovmentButtonProps extends MovmentButtonProps, AraTesterAxisId, AraTesterAxisDistance {

}

export interface AraTesterAutoMovmentButtonState {
    timeout?: number;
    event?: 'release' | 'press' | 'timeout';
    movment?: boolean;
}

export default class AraTesterAutoMovmentButton extends React.Component<AraTesterAutoMovmentButtonProps, AraTesterAutoMovmentButtonState> {
    private _AraTesterAxisService: AraTesterAxisService;
    public onButtonPress: SyntheticEventHandler;
    public onButtonRelease: SyntheticEventHandler;

    private _move(): void {
        if(!this.state.movment) {
            this.setState({ movment: true });
            this._AraTesterAxisService.movment({
                direction: !this.props.movment.match(/(forward)|(right)|(up)|(rotate right)/),
                distance: this.props.distance
            });
        }
    }

    public constructor(props: AraTesterAutoMovmentButtonProps) {
        super(props);
        this.state = {
            timeout: null,
            event: 'release',
            movment: false
        };
        this.onButtonPress = this.handleButtonPress.bind(this);
        this.onButtonRelease = this.handleButtonRelease.bind(this);
        this._AraTesterAxisService = new AraTesterAxisService(this.props.axisId);
    }

    public componentDidMount(): void {
        this._AraTesterAxisService.onMovmentEnd(() => {
            this.setState({ movment: false });
            if(this.state.event === 'timeout') {
                this._move();
            }
        });
    }

    public componentWillUnmount(): void {
        this._AraTesterAxisService.removeMovmentEnd();
    }

    public shouldComponentUpdate(props: AraTesterAutoMovmentButtonProps, state: AraTesterAutoMovmentButtonState): boolean {
        return this.props.movment !== props.movment;
    }

    public handleButtonPress(event: React.SyntheticEvent): void {
        event.preventDefault();
        if(!this.state.movment) {
            console.log('press');
            this.setState({ event: 'press'});
            this.setState({
                timeout: window.setTimeout(() => {
                    console.log('timeout');
                    this.setState({ event: 'timeout' });
                    this._move();
                }, 300)
            });
            this._move();
        }
    }

    public handleButtonRelease(event: React.SyntheticEvent): void {
        event.preventDefault();
        console.log('release');
        switch(this.state.event) {
            case 'release': {
                console.log('forced');
                this._move();
                break;
            }
            case 'press': {
                clearTimeout(this.state.timeout);
                break;
            }
            case 'timeout': {
                break;
            }
        }
        this.setState({ event: 'release' });
    }

    public render(): JSX.Element {
        const { props, onButtonPress, onButtonRelease } = this;
        const { style, movment} = props;
        return (
            <MovmentButton
                style={style}
                movment={movment}
                onButtonPress={onButtonPress}
                onButtonRelease={onButtonRelease} />
        );
    }
}