export function replaceWithTeact(input, searchValue, replaceValue) {
    const parts = input.split(searchValue);
    const [firstElement, ...rest] = parts;
    return rest.reduce((acc, curr) => (acc.concat(replaceValue, curr)), [firstElement]).filter(Boolean);
}
export function replaceInStringsWithTeact(input, searchValue, replaceValue) {
    return input.flatMap((curr) => {
        if (typeof curr === 'string')
            return replaceWithTeact(curr, searchValue, replaceValue);
        return curr;
    }, []);
}
