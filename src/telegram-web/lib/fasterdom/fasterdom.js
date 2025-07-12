import safeExec from '../../util/safeExec';
import { fastRaf, throttleWith } from '../../util/schedulers';
import { setPhase } from './stricterdom';
let pendingMeasureTasks = [];
let pendingMutationTasks = [];
let pendingForceReflowTasks = [];
const runUpdatePassOnRaf = throttleWithRafFallback(() => {
    const currentMeasureTasks = pendingMeasureTasks;
    pendingMeasureTasks = [];
    currentMeasureTasks.forEach((task) => {
        safeExec(task);
    });
    // We use promises to provide correct order for Mutation Observer callback microtasks
    void Promise.resolve()
        .then(() => {
        setPhase('mutate');
        const currentMutationTasks = pendingMutationTasks;
        pendingMutationTasks = [];
        currentMutationTasks.forEach((task) => {
            safeExec(task);
        });
    })
        .then(() => {
        setPhase('measure');
        const pendingForceReflowMutationTasks = [];
        // Will include tasks created during the loop
        for (const task of pendingForceReflowTasks) {
            safeExec(() => {
                const mutationTask = task();
                if (mutationTask) {
                    pendingForceReflowMutationTasks.push(mutationTask);
                }
            });
        }
        pendingForceReflowTasks = [];
        return pendingForceReflowMutationTasks;
    })
        .then((pendingForceReflowMutationTasks) => {
        setPhase('mutate');
        // Will include tasks created during the loop
        for (const task of pendingForceReflowMutationTasks) {
            safeExec(task);
        }
    })
        .then(() => {
        setPhase('measure');
    });
});
export function requestMeasure(cb) {
    pendingMeasureTasks.push(cb);
    runUpdatePassOnRaf();
}
export function requestMutation(cb) {
    pendingMutationTasks.push(cb);
    runUpdatePassOnRaf();
}
export function requestNextMutation(cb) {
    requestMeasure(() => {
        requestMutation(cb);
    });
}
export function requestForcedReflow(cb) {
    pendingForceReflowTasks.push(cb);
    runUpdatePassOnRaf();
}
function throttleWithRafFallback(fn) {
    return throttleWith((throttledFn) => {
        fastRaf(throttledFn, true);
    }, fn);
}
export * from './stricterdom';
