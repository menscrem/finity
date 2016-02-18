import StateMachine from '../src';
import HandlerMocks from './support/HandlerMocks';

describe('start', () => {
  it('sets the state to the initial state', () => {
    const stateMachine = StateMachine
      .configure()
      .initialState('state1')
      .start();

    expect(stateMachine.getCurrentState()).toBe('state1');
  });

  it('executes onStateEnter hooks and state entry actions with the correct parameters', () => {
    const mocks = new HandlerMocks();

    const stateMachine = StateMachine
      .configure()
      .global().onStateEnter(mocks.onStateEnterHook)
      .initialState('state1').onEnter(mocks.stateEntryAction)
      .start();

    const context = { stateMachine };

    expect(mocks.calledHandlers).toEqual([
      ['onStateEnterHook', 'state1', context],
      ['stateEntryAction', 'state1', context],
    ]);
  });

  it('does not execute onTransition and onStateChange hooks', () => {
    const mocks = new HandlerMocks();

    StateMachine
      .configure()
      .global()
        .onTransition(mocks.onTransitionHook)
        .onStateChange(mocks.onStateChangeHook)
      .initialState('state1')
      .start();

    expect(mocks.onTransitionHook).not.toHaveBeenCalled();
    expect(mocks.onStateChangeHook).not.toHaveBeenCalled();
  });

  it('completes the execution of initial state\'s entry actions before processing events', () => {
    const mocks = new HandlerMocks();

    const stateMachine = StateMachine
      .configure()
      .initialState('state1')
        .onEnter((state, context) => {
          context.stateMachine.handle('event1');
          // this should be called before processing the event
          mocks.stateEntryAction(state, context);
        })
        .onEnter(mocks.stateEntryAction)
        .on('event1').transitionTo('state2').withAction(mocks.transitionAction)
        .onExit(mocks.stateExitAction)
      .state('state2')
        .onEnter(mocks.stateEntryAction)
      .start();

    expect(stateMachine.getCurrentState()).toBe('state2');

    const context1 = { stateMachine };
    const context2 = { stateMachine, event: 'event1' };

    expect(mocks.calledHandlers).toEqual([
      ['stateEntryAction', 'state1', context1],
      ['stateEntryAction', 'state1', context1],
      ['stateExitAction', 'state1', context2],
      ['transitionAction', 'state1', 'state2', context2],
      ['stateEntryAction', 'state2', context2],
    ]);
  });

  it('throws if configuration is not specified', () => {
    expect(() => StateMachine.start())
      .toThrowError('Configuration must be specified.');
  });

  it('throws if configuration is null', () => {
    expect(() => StateMachine.start(null))
      .toThrowError('Configuration must be specified.');
  });

  it('throws if configuration is not an object', () => {
    expect(() => StateMachine.start(100))
      .toThrowError('Configuration must be an object.');
  });

  it('throws if initial state is not defined', () => {
    expect(() => StateMachine.configure().start())
      .toThrowError('Initial state must be specified.');
  });
});
