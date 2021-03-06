import * as Path from 'path';
import * as Hapi from 'hapi';
import * as Inert from 'inert';
import * as Nes from 'nes';
import * as Mongoose from 'mongoose';
import * as Ip from 'ip';
import { Config } from './../share/config';
import AraTesterAxisController from './controllers/AraTesterAxisController';
import AraTesterAxisId from './../share/AraTesterAxisId';
import AraTesterAxisDistance from './../share/AraTesterAxisDistance';

Mongoose.Promise = global.Promise;
Mongoose.connect('mongodb://localhost:27017/AraTester');

let axis: AraTesterAxisController = new AraTesterAxisController(0);

let server = new Hapi.Server({
    connections: {
        routes: {
            files: {
                relativeTo: Path.join(__dirname, '../public')
            }
        }
    }
});

server.connection({ port: Config.PORT });

server.register(Inert, () => {
    server.route({
        method: 'GET',
        path: '/{file*}',
        handler: {
            directory: {
                path: '.',
            }
        }
    });
});

server.register(Nes, (regErr: any) => {
    if(regErr) {
        throw regErr;
    } else {
        let wsServer: Nes.Server = server as Nes.Server;
        wsServer.subscription('/AraTesterAxisOnMovmentStart/{id}');
        wsServer.subscription('/AraTesterAxisOnMovmentEnd/{id}');

        AraTesterAxisController.onMovmentStart = (id: AraTesterAxisId, position: AraTesterAxisDistance): void => {
            wsServer.publish(`/AraTesterAxisOnMovmentStart/${id.axisId}`, position);
        };

        AraTesterAxisController.onMovmentEnd = (id: AraTesterAxisId, position: AraTesterAxisDistance): void => {
            wsServer.publish(`/AraTesterAxisOnMovmentEnd/${id.axisId}`, position);
        };

        wsServer.route({
            method: 'GET',
            path: '/AraTesterAxisGetConfiguration/{id}',
            config: {
                handler: (request: Hapi.Request, reply: Hapi.IReply) => {
                    reply(axis.getConfiguration());
                }
            }
        });

        wsServer.route({
            method: 'PATCH',
            path: '/AraTesterAxisSaveConfiguration/{id}',
            config: {
                handler: (request: Hapi.Request, reply: Hapi.IReply) => {
                    axis.update(request.payload);
                    reply({});
                }
            }
        });

        wsServer.route({
            method: 'POST',
            path: '/AraTesterAxisMovment/{id}',
            config: {
                handler: (request: Hapi.Request, reply: Hapi.IReply) => {
                    let tBefore: Date = new Date();
                    axis.movment(request.payload).then((count: number) => {
                        console.log("Counter: " + count);
                        console.log("Time elapsed in MS: " + ((new Date()).getTime() - tBefore.getTime()));
                        console.log("------------------------------------------------------------");
                    }).catch((err: NodeJS.ErrnoException) => {
                        console.log("Error: " + JSON.stringify(err));
                    });
                    reply({});
                }
            }
        });

        wsServer.route({
            method: 'GET',
            path: '/AraTesterAxisStop/{id}',
            config: {
                handler: (request: Hapi.Request, reply: Hapi.IReply) => {
                    axis.stop();
                    reply({});
                }
            }
        });

        wsServer.route({
            method: 'GET',
            path: '/AraTesterAxisGetPosition/{id}',
            config: {
                handler: (request: Hapi.Request, reply: Hapi.IReply) => {
                    reply(axis.getPosition());
                }
            }
        });

        wsServer.route({
            method: 'GET',
            path: '/test',
            config: {
                handler: (request: Hapi.Request, reply: Hapi.IReply) => {
                    let positions: Array<number> = [
                        130.23,
                        40.34,
                        125.56,
                        60.45,
                        87.23,
                        75.16,
                        172.90,
                        10.11,
                        2.00
                    ]

                    function goToNextPosition(): void {
                        if(positions.length) {
                            axis.goToPosition(positions.shift()).then(goToNextPosition);
                        }
                    }

                    goToNextPosition();
                    reply({});
                }
            }
        });
    }
});

axis.autoConfigurate().then(() => {
    server.start((err: any) => {
        if (err) {
            throw err;
        } else {
            console.log(`Server running at: http://${Ip.address()}:${server.info.port}`);
        }
    });
}).catch((configErr: any) => {
    throw configErr;
});
