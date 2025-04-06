import React from 'react'
import { useParams } from 'react-router'
import { useState } from 'react';
import { categories } from '../services/apis';
import Footer from '../componenets/common/Footer'
import { apiConnector } from '../services/apiconnector';
import { useEffect } from 'react';
import CourseSlider from '../componenets/core/Catalog/CourseSlider';
import { getCatalogaPageData } from '../services/operations/pageAndComponentData';
import CatalogCard from '../componenets/core/Catalog/CatalogCard';
import { useDispatch } from 'react-redux';
import toast from "react-hot-toast"
const Catalog = () => {

  const Catalog = useParams();
  const [Desc, setDesc] = useState([]);
  const [CatalogPageData, setCatalogPageData] = useState(null);
  const [categoryID, setcategoryID] = useState(null);
  const [active, setActive] = useState(1);
  const dispatch = useDispatch();


  const fetchSublinks=  async ()=>{
    try {
        const result = await apiConnector("GET",categories.CATEGORIES_API);
        const category_id= result.data.data.filter((item)=>item.name=== Catalog.catalog)[0]._id;
        setcategoryID(category_id);      
        setDesc(result.data.data.filter((item)=>item.name=== Catalog.catalog)[0]);
        // console.log("Desc",Desc);  
        // console.log(category_id);
        
        
    } catch (error) {
        console.log("could not fetch sublinks");
        console.log(error);
        toast.error("COULD NOT FETCH LINK")
    }
}
useEffect(() => {
    fetchSublinks();
}, [Catalog])

useEffect(() => {
    const fetchCatalogPageData = async () => {
        
            const result = await getCatalogaPageData(categoryID,dispatch);
            setCatalogPageData(result);
            // console.log("page data",CatalogPageData);
           
    }
    if (categoryID) {
        fetchCatalogPageData();
    }
}, [categoryID])


return (
  <>
    {/* Hero Section */}
    <div className=" box-content bg-richblack-800 px-4">
      <div className="mx-auto flex min-h-[260px] max-w-maxContentTab flex-col 
      justify-center gap-4 lg:max-w-maxContent ">
        <p className="text-sm text-richblack-300">
          {`Home / Catalog / `}
          <span className="text-yellow-25">
            {CatalogPageData?.data?.selectedCategory?.name}
          </span>
        </p>
        <p className="text-3xl text-richblack-5">
          {CatalogPageData?.data?.selectedCategory?.name}
        </p>
        <p className="max-w-[870px] text-richblack-200">
          {CatalogPageData?.data?.selectedCategory?.description}
        </p>
      </div>
    </div>

    {/* Section 1 */}
    <div className=" mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
      <div className="section_heading font-extrabold md:text-xl text-richblack-5 text-center">Courses to get you started</div>
      <div className="my-4 flex border-b border-b-richblack-600 text-sm">
        <p
          className={`px-4 py-2 font-extrabold ${
            active === 1
              ? "border-b border-b-yellow-25 text-yellow-25"
              : "text-richblack-50"
          } cursor-pointer`}
          onClick={() => setActive(1)}
        >
          Most Populer
        </p>
        <p
          className={`px-4 py-2 font-extrabold ${
            active === 2
              ? "border-b border-b-yellow-25 text-yellow-25"
              : "text-richblack-50"
          } cursor-pointer`}
          onClick={() => setActive(2)}
        >
          New
        </p>
      </div>
      <div>
        <CourseSlider
          Courses={CatalogPageData?.data?.selectedCategory?.courses} 
        />
      </div>
    </div>
    {/* Section 2 */}
    <div className=" mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
      <div className="section_heading font-extrabold md:text-xl text-richblack-5 text-center">
        Top courses in {CatalogPageData?.data?.differentCategory?.name}
      </div>
      <div className="py-8">
        <CourseSlider
          Courses={CatalogPageData?.data?.differentCategory?.courses}
        />
      </div>
    </div>

    {/* Section 3 */}
    <div className=" mx-auto box-content w-full max-w-maxContentTab px-4 py-14 lg:max-w-maxContent">
      <div className="section_heading font-extrabold md:text-xl text-richblack-5 text-center py-8">Frequently Bought</div>
      <div className="py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {CatalogPageData?.data?.mostSellingCourses
            ?.slice(0, 4)
            .map((course, i) => (
              <CatalogCard course={course} key={i} Height={"h-[400px]"} />
            ))}
        </div>
      </div>
    </div>

    <Footer />
  </>
)
}

export default Catalog