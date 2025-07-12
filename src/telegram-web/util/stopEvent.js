const stopEvent = (e) => {
    e.stopPropagation();
    e.preventDefault();
};
export default stopEvent;
