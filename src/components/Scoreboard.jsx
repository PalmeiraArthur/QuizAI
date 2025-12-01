import websocketService from "../services/websocketService";

const Scoreboard = ({
  roomId,  
  playersScoreboardList = [],
  maxPlayers = 0,
  roomOwnerId,
  userId
}) => {
    function increasePoints()
    {
        websocketService.sendPlayerScore(roomId, playerScoreId, 10)
    }
    function decreasePoints()
    {
        websocketService.sendPlayerScore(roomId, playerScoreId, -10)
    }

    const playerScoreId = localStorage.getItem('scoreId');


  return (
    <div className="rounded-md w-[211px]">

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-bold text-white">Jogadores</h2>

        <div className="bg-pistachio text-raisinBlack px-4 py-2 rounded-md font-bold text-lg">
          {playersScoreboardList.length}/{maxPlayers}
        </div>
      </div>

      <div className="bg-darkGunmetal space-y-3 rounded-md p-1">
        {playersScoreboardList.map((playerScore) => {
          const score = playerScore.score;
          const scoreId = playerScore.id;
          const playerId = playerScore.player?.id;
          const isPlayerHost = String(playerId) === String(roomOwnerId);
          const isYou = String(playerId) === String(userId);

          return (
            <div
              key={scoreId}
              className={`${
                isYou ? "bg-plumpPurple" : "bg-darkGunmetal/80"
              } rounded-lg p-4 flex items-center gap-3 border border-plumpPurple/20`}
            >
              <div className="w-10 h-10 bg-pistachio rounded-full flex items-center justify-center text-raisinBlack font-bold text-xl">
                {isPlayerHost ? "👑" : "👤"}
              </div>

              <div>
                <p className="text-white font-semibold">
                  {isYou ? "Você" : playerScore.player?.username}
                </p>

                {isPlayerHost && (
                  <p className="text-gray-300 text-sm">Host</p>
                )}
              </div>


              {/* TESTE REMOVER DEPOIS */}
              <p onClick={increasePoints}>up</p>
              <p onClick={decreasePoints}>down</p>
              {/* TESTE REMOVER DEPOIS */}


              <p className="text-white font-semibold ml-auto">
                  {score}
              </p>
            </div>
          );
        })}

        {/* Slots vazios */}
        {Array(Math.max(0, maxPlayers - playersScoreboardList.length))
          .fill(null)
          .map((_, i) => (
            <div
              key={i}
              className="bg-darkGunmetal rounded-lg p-4 flex items-center gap-3 opacity-50 border border-plumpPurple/20"
            >
              <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
              <p className="text-gray-500">Aguardando jogador...</p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Scoreboard;
