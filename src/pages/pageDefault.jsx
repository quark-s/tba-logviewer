import { createRef, useEffect, useMemo, useState } from 'react'
// import './App.css'
import EeWrapper from 'src/components/EeWrapper/EeWrapper'
// import { PrimeReactProvider } from 'primereact/api';

// import "primereact/resources/themes/lara-light-cyan/theme.css";
import { useSearchParams } from 'react-router-dom';
import { create } from 'lodash';
import { BlobReader, BlobWriter, TextWriter, ZipReader } from '@zip.js/zip.js';
import { toast } from 'react-toastify';

function PageDefault() {

  let [searchParams, setSearchParams] = useSearchParams();
  
  const entrypoint = searchParams.get("sequence") ?? import.meta.env.VITE_DEFAULT_ENTRYPOINT;
  const vOffset = searchParams.get("offset") ?? 0;

  const [timeFrame, setTimeFrame] = useState(null);
  const [events, setEvents] = useState(null);
  const [eventsMeta, setEventsMeta] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [loaded, setLoaded] = useState(false);

  const uploadRef = createRef();

  const fetchMeta = (entrypoint) => {
    let pTimeFrame = fetch(`Screencasts/${entrypoint}.json`)
      .then(response => {
        if (response.ok)
          return response.json();
      })
      .catch(error => {
        console.error(error);
        toast.warn("Couldn't load timeframe file");
      });      

    let pEvents = fetch(`Screencasts/${entrypoint}.events.json`)
      .then(response => {
        if (response.ok)
          return response.json();
      })
      .catch(error => {
        console.error(error);
        toast.warn("Couldn't load events file");
      });

    Promise.all([pTimeFrame, pEvents])
      .then(([vTimeFrame, vEvents]) => {
        // console.log([vTimeFrame, vEvents]);
        setTimeFrame(vTimeFrame);
        setEvents(vEvents);
        setVideoUrl(`Screencasts/${entrypoint}`);
        setLoaded(true);
      })
      .catch((error) => {
        console.error(error.message);
        toast.warn("Invalid entrypoint")
      });

      fetch(`meta.json`)
      .then(response => {
        if (response.ok){
          response.json().then(data => {
            setEventsMeta(data);
          });
        }
      })
  }

  useEffect(() => {

    if(!!entrypoint)
        fetchMeta(entrypoint);
  }, [searchParams])

  const handleUpload =  () => {
    console.log('handleUpload', uploadRef.current.files[0].name);
    var reader = new FileReader();
    reader.addEventListener("loadend",  e => {
        // console.log(JSON.parse(event.target.result));
        try {
          console.log(reader.result);
          setLoaded(false);
          const arrayBuffer = reader.result;
          const blob = new Blob([arrayBuffer]);
          const zipFileReader = new BlobReader(blob);
          const zipReader = new ZipReader(zipFileReader);
          const entries =  zipReader.getEntries()
          .then(entries => {
            console.log(entries);
            entries.forEach(entry => {
              console.log(entry.filename);
              if(entry.filename.endsWith('.json')){
                entry.getData(new TextWriter())
                .then((data) => {
                  const meta = JSON.parse(data);
                  console.log(meta);
                  if(meta.traceLogs){
                    setEvents(meta.traceLogs);
                  }
                  if(meta.ts_begin && meta.ts_video_start && meta.ts_end){
                    setTimeFrame({ts_begin: meta.ts_begin, ts_video_start: meta.ts_video_start, ts_end: meta.ts_end});
                  }
                })
                .catch(error => {
                  toast.warn("Couldn't parse meta file")
                });
              }
              if(entry.filename.endsWith('.webm') || entry.filename.endsWith('.mp4')){
                entry.getData(new BlobWriter())
                .then((data) => {
                  const url = URL.createObjectURL(data);
                  console.log(url);
                  setVideoUrl(url);
                }).catch(error => {
                  toast.warn("Couldn't load video file")
                });
              }
            });
          })
          .catch(error => {
            console.error(error);
            toast.warn("Couldn't read zip file")
          })
          .finally(() => {
            zipReader.close();
            setLoaded(true);
          });
        } catch (error) {
            console.error(error);
            setLoaded(true);
        }
    });
    reader.readAsArrayBuffer(uploadRef.current.files[0]);    
  }

  return (
    <>
      <div className='w-full h- h-screen'>
        {
          loaded && <EeWrapper onUpload={() => {uploadRef?.current.click();}} timeFrame={timeFrame} events={events} meta={eventsMeta} url={videoUrl} offset={vOffset} />
        }
        {!loaded && <p>Loading ...</p>}
        <input type="file" ref={uploadRef} onChange={handleUpload}  hidden />
      </div>
    </>
  )
}

export default PageDefault
