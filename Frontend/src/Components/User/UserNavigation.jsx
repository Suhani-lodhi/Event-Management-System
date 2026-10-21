
export default function UserNavigation(){
    return (
        <>
          <div className="user-nav">
            <div>
              <a href="/home/events?category=MOVIE">Movies</a>
              <a href="/home/events?category=STANDUP">Standup</a>
              <a href="/home/events?category=GAME">Game</a>
              <a href="/home/events?category=ACTIVITY">Activity</a>
            </div>
          <div>
            <a href="">Host your show</a>
          </div>
          </div>
        </>
    )
}