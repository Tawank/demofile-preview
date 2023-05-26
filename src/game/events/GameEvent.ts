import Emittery, {type EmitteryOncePromise, type UnsubscribeFunction} from 'emittery';

export type GameEvents = {
	'game:ready': boolean;
};

export default class GameEvent {
	private readonly emitter = new Emittery<GameEvents>();

	public onAny(
		listener: (
			event: keyof GameEvents,
			data: GameEvents[keyof GameEvents]
		) => void | Promise<void>,
	): UnsubscribeFunction {
		return this.emitter.onAny(listener);
	}

	public on<Name extends keyof GameEvents>(
		event: Name | readonly Name[],
		listener: (data: GameEvents[Name]) => void | Promise<void>,
	): UnsubscribeFunction {
		return this.emitter.on(event, listener);
	}

	public once<Name extends keyof GameEvents>(event: Name | readonly Name[]): EmitteryOncePromise<GameEvents[Name]> {
		return this.emitter.once(event);
	}

	public off<Name extends keyof GameEvents>(
		event: Name | readonly Name[],
		listener: (data: GameEvents[Name]) => void | Promise<void>,
	) {
		this.emitter.off(event, listener);
	}

	public send<Name extends keyof GameEvents>(
		event: Name,
		data: GameEvents[Name],
	) {
    void this.emitter.emit(event, data);
	}
}
