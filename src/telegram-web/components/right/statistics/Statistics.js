import { memo, useEffect, useMemo, useRef, useState, } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';
import { selectChat, selectChatFullInfo, selectChatMessages, selectPeerStories, selectStatistics, } from '../../../global/selectors';
import buildClassName from '../../../util/buildClassName';
import { callApi } from '../../../api/gramjs';
import useForceUpdate from '../../../hooks/useForceUpdate';
import useOldLang from '../../../hooks/useOldLang';
import Loading from '../../ui/Loading';
import StatisticsOverview from './StatisticsOverview';
import StatisticsRecentMessage from './StatisticsRecentMessage';
import StatisticsRecentStory from './StatisticsRecentStory';
import styles from './Statistics.module.scss';
let lovelyChartPromise;
let LovelyChart;
async function ensureLovelyChart() {
    if (!lovelyChartPromise) {
        lovelyChartPromise = import('../../../lib/lovely-chart/LovelyChart');
        LovelyChart = await lovelyChartPromise;
    }
    return lovelyChartPromise;
}
const CHANNEL_GRAPHS_TITLES = {
    growthGraph: 'ChannelStats.Graph.Growth',
    followersGraph: 'ChannelStats.Graph.Followers',
    muteGraph: 'ChannelStats.Graph.Notifications',
    topHoursGraph: 'ChannelStats.Graph.ViewsByHours',
    viewsBySourceGraph: 'ChannelStats.Graph.ViewsBySource',
    newFollowersBySourceGraph: 'ChannelStats.Graph.NewFollowersBySource',
    languagesGraph: 'ChannelStats.Graph.Language',
    interactionsGraph: 'ChannelStats.Graph.Interactions',
    reactionsByEmotionGraph: 'ChannelStats.Graph.Reactions',
    storyInteractionsGraph: 'ChannelStats.Graph.Stories',
    storyReactionsByEmotionGraph: 'ChannelStats.Graph.StoriesReactions',
};
const CHANNEL_GRAPHS = Object.keys(CHANNEL_GRAPHS_TITLES);
const GROUP_GRAPHS_TITLES = {
    growthGraph: 'Stats.GroupGrowthTitle',
    membersGraph: 'Stats.GroupMembersTitle',
    languagesGraph: 'Stats.GroupLanguagesTitle',
    messagesGraph: 'Stats.GroupMessagesTitle',
    actionsGraph: 'Stats.GroupActionsTitle',
    topHoursGraph: 'Stats.GroupTopHoursTitle',
};
const GROUP_GRAPHS = Object.keys(GROUP_GRAPHS_TITLES);
const Statistics = ({ chatId, chat, statistics, dcId, isGroup, messagesById, storiesById, }) => {
    const lang = useOldLang();
    const containerRef = useRef();
    const [isReady, setIsReady] = useState(false);
    const loadedCharts = useRef([]);
    const { loadStatistics, loadStatisticsAsyncGraph } = getActions();
    const forceUpdate = useForceUpdate();
    useEffect(() => {
        loadStatistics({ chatId, isGroup });
    }, [chatId, loadStatistics, isGroup]);
    const graphs = useMemo(() => {
        return isGroup ? GROUP_GRAPHS : CHANNEL_GRAPHS;
    }, [isGroup]);
    const graphTitles = useMemo(() => {
        return isGroup ? GROUP_GRAPHS_TITLES : CHANNEL_GRAPHS_TITLES;
    }, [isGroup]);
    // Load async graphs
    useEffect(() => {
        if (!statistics) {
            return;
        }
        graphs.forEach((name) => {
            const graph = statistics[name];
            const isAsync = typeof graph === 'string';
            if (isAsync) {
                loadStatisticsAsyncGraph({
                    name,
                    chatId,
                    token: graph,
                    // Hardcode percentage for languages graph, since API does not return `percentage` flag
                    isPercentage: name === 'languagesGraph',
                });
            }
        });
    }, [graphs, chatId, statistics, loadStatisticsAsyncGraph]);
    useEffect(() => {
        (async () => {
            await ensureLovelyChart();
            if (!isReady) {
                setIsReady(true);
                return;
            }
            if (!statistics || !containerRef.current) {
                return;
            }
            graphs.forEach((name, index) => {
                const graph = statistics[name];
                const isAsync = typeof graph === 'string';
                if (isAsync || loadedCharts.current.includes(name)) {
                    return;
                }
                if (!graph) {
                    loadedCharts.current.push(name);
                    return;
                }
                const { zoomToken } = graph;
                LovelyChart.create(containerRef.current.children[index], {
                    title: lang(graphTitles[name]),
                    ...zoomToken ? {
                        onZoom: (x) => callApi('fetchStatisticsAsyncGraph', { token: zoomToken, x, dcId }),
                        zoomOutLabel: lang('Graph.ZoomOut'),
                    } : {},
                    ...graph,
                });
                loadedCharts.current.push(name);
                containerRef.current.children[index].classList.remove(styles.hidden);
            });
            forceUpdate();
        })();
    }, [
        graphs, graphTitles, isReady, statistics, lang, chatId, loadStatisticsAsyncGraph, dcId, forceUpdate,
    ]);
    return (<div className={buildClassName(styles.root, 'panel-content custom-scroll', isReady && styles.ready)}>
      {statistics && (<StatisticsOverview statistics={statistics} type={isGroup ? 'group' : 'channel'} title={lang('StatisticOverview')}/>)}

      {!loadedCharts.current.length && <Loading />}

      <div ref={containerRef}>
        {graphs.map((graph) => (<div key={graph} className={buildClassName(styles.graph, styles.hidden)}/>))}
      </div>

      {Boolean(statistics?.recentPosts?.length) && (<div className={styles.messages}>
          <h2 className={styles.messagesTitle}>{lang('ChannelStats.Recent.Header')}</h2>

          {statistics.recentPosts.map((postStatistic) => {
                if ('msgId' in postStatistic) {
                    const message = messagesById[postStatistic.msgId];
                    if (!message || !('content' in message))
                        return undefined;
                    return (<StatisticsRecentMessage key={`statistic_message_${postStatistic.msgId}`} message={message} postStatistic={postStatistic}/>);
                }
                if ('storyId' in postStatistic && chat) {
                    const story = storiesById?.[postStatistic.storyId];
                    return (<StatisticsRecentStory key={`statistic_story_${postStatistic.storyId}`} chat={chat} story={story} postStatistic={postStatistic}/>);
                }
                return undefined;
            })}
        </div>)}
    </div>);
};
export default memo(withGlobal((global, { chatId }) => {
    const statistics = selectStatistics(global, chatId);
    const chat = selectChat(global, chatId);
    const dcId = selectChatFullInfo(global, chatId)?.statisticsDcId;
    const isGroup = chat?.type === 'chatTypeSuperGroup';
    const messagesById = selectChatMessages(global, chatId);
    const storiesById = selectPeerStories(global, chatId)?.byId;
    return {
        statistics, dcId, isGroup, chat, messagesById, storiesById,
    };
})(Statistics));
