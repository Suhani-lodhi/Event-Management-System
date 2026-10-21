import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"
import { getEventsByFilter } from "../../api/user";
import EventCard from "../../Components/User/EventCard";

const CATEGORIES = ['MOVIE', 'STANDUP', 'GAME', 'ACTIVITY'];
const GENRES = ['ACTION', 'HORROR', 'COMEDY', 'FUN'];

const toArray = (value) => (value ? value.split(',') : []);

export default function EventFilterPage(){

    const [searchParams, setSearchParams] = useSearchParams();
    const [events, setEvents] = useState([]);
    const [loading, setLoading]= useState(true);
    const navigate = useNavigate();

  const selectedCategories = toArray(searchParams.get('category'));
  const selectedGenres = toArray(searchParams.get('genre'));


    const toggle = (key, value) => {

        console.log("called the toggle", key, value);
    const current = toArray(searchParams.get(key));
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    const params = new URLSearchParams(searchParams);
    if (next.length) params.set(key, next.join(','));
    else params.delete(key);
    setSearchParams(params);
  };

  const clearAll = () => setSearchParams({});

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const data = await getEventsByFilter({
          category: selectedCategories.join(','),
          genre: selectedGenres.join(','),
        });
        setEvents(data.events);
        console.log("api called", selectedCategories, selectedGenres)
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [selectedCategories.join(','), selectedGenres.join(',')]);



  function FilterGroup({ title, options, selected, onToggle }) {
  return (
    <div className="filter-group">
      <h4>{title}</h4>
      <div className="filter-group__chips">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={selected.includes(opt) ? 'chip active' : 'chip'}
            onClick={() => onToggle(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
    )
}

// function searchCalled(e){
//     console.log(e.target.value);
// }


  const hasFilters = selectedCategories.length || selectedGenres.length;
    return (
        <>
        <button onClick={()=>navigate('/user/home')}>Home</button>
             <div className="filter-page">
      <aside className="filters">
        <div className="filters__header">
          <h3>Filters</h3>
          {hasFilters ? (
            <button className="filters__clear" onClick={clearAll} type="button">Clear all</button>
          ) : null}
        </div>

        <FilterGroup
          title="Category"
          options={CATEGORIES}
          selected={selectedCategories}
          onToggle={(v) => toggle('category', v)}
        />
        <FilterGroup
          title="Genre"
          options={GENRES}
          selected={selectedGenres}
          onToggle={(v) => toggle('genre', v)}
        />
      </aside>

      <section className="results">
        {/* <input type="text" placeholder="Search..." className="input-search" onChange={(e)=> searchCalled(e)}/> */}
        
        {loading ? (
          <p>Loading...</p>
        ) : events.length === 0 ? (
          <p>No events match these filters.</p>
        ) : (
          <div className="ud-events">
            {events.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </section>
    </div>
    </>
  );
}

