import { getImageSrc } from "../../utils/imageUrl";
import './styles/EventCard.css';

export default function EventCard({event}){
    const { Title, imageUrl, category, genre } = event;
    return (
        <>
          <div className="event-card">
      <div className="event-card__image-wrapper">
        <img
          className="event-card__image"
          src={getImageSrc(imageUrl)}
          alt={Title}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x250?text=No+Image';
          }}
        />
        <span className="event-card__category">{category}</span>
      </div>

      <div className="event-card__body">
        <h3 className="event-card__title">{Title}</h3>
        <span className="event-card__genre">{genre}</span>
      </div>
    </div>
        </>
    )
}