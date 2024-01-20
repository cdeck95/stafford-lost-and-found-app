import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL, Disc, DiscStateString } from "../App";
import "../styles/Inventory.css"; // Import the CSS file
import { DateTime } from "luxon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import {
  CircularProgress,
  Divider,
  IconButton,
  InputBase,
  Paper,
  TextField,
  useMediaQuery,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EditDialog from "./EditDialog";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { useTheme } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import InfoIcon from "@mui/icons-material/Info";
import BackToTopButton from "./BackToTopButton";

// Define a type for row IDs, assuming it's a number
type RowId = number;

function PublicInventory() {
  const [inventory, setInventory] = useState<Disc[]>([]); // Provide the type 'Disc[]'
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredInventory, setFilteredInventory] = useState(inventory); // Initialize with inventory data
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [claimedDisc, setClaimedDisc] = useState<number>(0); // Provide the type 'Disc | null'
  const theme = useTheme();
  const isMobile = !useMediaQuery(theme.breakpoints.up("md"));
  const isMediumLarge = useMediaQuery(theme.breakpoints.down("lg"));
  const isLarge = useMediaQuery(theme.breakpoints.down("xl"));
  const [sortOption, setSortOption] = useState<keyof Disc>("pickupDeadline"); // Set initial sort option
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc"); // Set initial sort direction to DESC
  const [showPastDeadlines, setShowPastDeadlines] = useState(false);
  const course = process.env.REACT_APP_COURSE_NAME;

  const [tooltipIsOpen, setTooltipIsOpen] = useState(false);

  // const [showTooltip, setShowTooltip] = useState(false);

  // const toggleTooltip = () => {
  //   setShowTooltip(!showTooltip);
  // };

  const [expandedRows, setExpandedRows] = useState<RowId[]>([]);

  const toggleRow = (rowId: RowId) => {
    if (expandedRows.includes(rowId)) {
      setExpandedRows(expandedRows.filter((id) => id !== rowId));
    } else {
      setExpandedRows([...expandedRows, rowId]);
    }
  };

  const convertToEST = (utcTimestamp: string) => {
    const dateUTC = DateTime.fromISO(utcTimestamp, { zone: "utc" });
    // const dateEST = dateUTC.setZone('America/New_York');

    // Format the date to display only the date (without time)
    //return dateEST.toFormat('yyyy-MM-dd');
    return dateUTC.toFormat("yyyy-MM-dd");
  };

  function maskPhoneNumber(phoneNumber: string): string {
    const last4Digits = phoneNumber.slice(-4);
    const maskedNumber = "****-****-" + last4Digits;
    return maskedNumber;
  }

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/inventory`, {
        params: {
          course: course,
        },
      })
      .then((response) => {
        // Convert UTC timestamps to EST
        const convertedInventory = response.data.map((disc: Disc) => ({
          ...disc,
          dateFound: convertToEST(disc.dateFound),
          dateTexted: disc.dateTexted ? convertToEST(disc.dateTexted) : null,
          dateClaimed: disc.dateClaimed ? convertToEST(disc.dateClaimed) : null,
          pickupDeadline: disc.pickupDeadline
            ? convertToEST(disc.pickupDeadline)
            : null,
        }));
        //console.log('Inventory:', convertedInventory);

        setInventory(convertedInventory);

        const sortedInventory = [...convertedInventory].sort(
          (a: Disc, b: Disc) => {
            const aValue = a[sortOption] as string; // Cast to string
            const bValue = b[sortOption] as string; // Cast to string

            if (sortDirection === "asc") {
              return aValue.localeCompare(bValue);
            } else {
              return bValue.localeCompare(aValue);
            }
          }
        );

        // setFilteredInventory(filtered);
        const filteredInventory = sortedInventory.filter((disc: Disc) => {
          const isMatch =
            disc.phoneNumber.includes(searchQuery) ||
            disc.disc.toLowerCase().includes(searchQuery.toLowerCase()) ||
            disc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            disc.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            disc.comments?.toLowerCase().includes(searchQuery.toLowerCase());

          // Check if the user wants to see past deadlines and if the pickupDeadline is in the past
          if (showPastDeadlines) {
            return (
              isMatch &&
              (!disc.pickupDeadline ||
                new Date(disc.pickupDeadline) < new Date())
            );
          } else {
            return isMatch;
          }
        });

        setFilteredInventory(filteredInventory);
      })
      .catch((error) => {
        console.error("Error fetching inventory:", error);
      });
  }, [searchQuery, showPastDeadlines, sortDirection, sortOption]);

  // function maskLastName(name: string): string {
  //   // Extract the last name (assuming last names are separated by a space)
  //   const names = name.split(' ');
  //   if (names.length >= 2) {
  //     const firstName = names[0];
  //     const lastName = names[names.length - 1];

  //     // Check if there is a last name before appending the "."
  //     const maskedLastName = `${firstName} ${lastName.charAt(0)}${lastName.length > 1 ? '.' : ''}`;
  //     return maskedLastName;
  //   }

  //   // Return the original name if it doesn't contain a last name
  //   return name;
  // }

  function maskFirstName(name: string): string {
    // Extract the first and last name (assuming names are separated by a space)
    const names = name.split(" ");
    if (names.length >= 2) {
      const firstName = names[0];
      const lastName = names[names.length - 1];

      // Mask the first name and keep the last name intact
      const maskedName = `${firstName.charAt(0)}. ${lastName}`;
      return maskedName;
    }

    // Return the original name if it doesn't contain a last name
    return name;
  }

  const handleSort = (selectedOption: keyof Disc) => {
    if (selectedOption === sortOption) {
      // Toggle sort direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortDirection("asc"); // Default to ascending if a new option is selected
    }
    setSortOption(selectedOption);
  };

  // Define a function to render the header with sorting indicator
  const renderColumnHeader = (column: keyof Disc, label: string) => {
    const isSorted = column === sortOption;
    const isAscending = sortDirection === "asc";
    const arrow = isSorted ? (isAscending ? "▲" : "▼") : null;

    return (
      <th className="table-header" onClick={() => handleSort(column)}>
        {label} {arrow}
      </th>
    );
  };

  return (
    <div className="page-container">
      <div className="col-center">
        {/* <h1>Inventory</h1> */}
        {/* <div className="search-bar"> */}
        <Paper
          component="form"
          sx={{
            p: "2px 4px",
            display: "flex",
            alignItems: "center",
            marginTop: "5px",
            width: isMobile ? "320px" : "700px",
          }}
        >
          <InputBase
            sx={{ ml: 1, flex: 1, fontSize: "12px" }}
            placeholder="Search by disc, name, or last 4 digits of your phone number"
            onChange={(e) => {
              const inputQuery = e.target.value;

              // Check if the input matches a phone number pattern (e.g., XXXX-XXXX-1234)
              const isPhoneNumber = /^\d{4}-\d{4}-\d{4}$/.test(inputQuery);

              // If it's a phone number, use the last 4 digits; otherwise, use the entire query
              const filteredQuery = isPhoneNumber
                ? inputQuery.slice(-4)
                : inputQuery;

              setSearchQuery(filteredQuery);
            }}
            value={searchQuery}
            type="text"
          />
          <IconButton type="button" sx={{ p: "10px" }} aria-label="search">
            <SearchIcon />
          </IconButton>
        </Paper>
        {/* </div> */}
      </div>
      <div className="container">
        <div className="table-container">
          <table className="inventory-table">
            <colgroup>
              <col style={{ width: "35px" }} />
              <col style={{ width: "30%" }} />{" "}
              {/* Adjust the width as needed */}
              <col style={{ width: "30%" }} />{" "}
              {/* Adjust the width as needed */}
              {/* <col style={{ width: "21%" }} />{" "} */}
              {/* Adjust the width as needed */}
              <col style={{ width: "37%" }} />{" "}
              {/* Adjust the width as needed */}
            </colgroup>
            <thead>
              <tr>
                <th className="table-header"> </th>
                {/* <th className="table-header">ID</th>  */}
                {/* <th className="table-header">Name</th>  */}
                {/* <th className="table-header">Color</th> 
                <th className="table-header">Bin</th> 
                <th className="table-header">Date Found</th> 
                <th className="table-header">Comments</th>  */}

                {renderColumnHeader("name", "Name")}
                {/* {renderColumnHeader('name', 'Phone Number')} */}
                {/* <th className="table-header">Phone Number</th>  */}
                {renderColumnHeader("disc", "Disc")}
                {/* {renderColumnHeader("dateFound", "Date Found")} */}
                {renderColumnHeader("pickupDeadline", "Pickup Deadline")}

                {/* 
                <th className="table-header">Disc</th> 
                
                <th className="table-header">Actions</th>  */}
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((disc) => (
                <React.Fragment key={disc.id}>
                  <tr
                    onClick={() => toggleRow(disc.id!)}
                    // className={
                    //   new Date(disc.pickupDeadline!) < new Date()
                    //     ? "past-deadline-row"
                    //     : ""
                    // }
                  >
                    <td className="table-cell">
                      {expandedRows.includes(disc.id!) ? "▼" : "▶"}
                    </td>
                    {/* <td className="table-cell">{disc.id}</td> */}
                    <td className="table-cell">{disc.name}</td>
                    {/* <td className="table-cell">{formatPhoneNumber(disc.phoneNumber)}</td> */}
                    <td className="table-cell">{disc.disc}</td>
                    {/* <td className="table-cell">{disc.dateFound}</td> */}
                    <td className="table-cell">
                      {disc.pickupDeadline}
                      {new Date(disc.pickupDeadline!) < new Date() && (
                        <FontAwesomeIcon
                          icon={faCircle}
                          style={{ color: "red", marginLeft: "10px" }}
                        />
                      )}
                      {disc.status === DiscStateString.New && (
                        <FontAwesomeIcon
                          icon={faCircle}
                          style={{ color: "orange", marginLeft: "10px" }}
                        />
                      )}
                      {disc.status !== DiscStateString.New &&
                        new Date(disc.pickupDeadline!) >= new Date() && (
                          <FontAwesomeIcon
                            icon={faCircle}
                            style={{ color: "yellow", marginLeft: "10px" }}
                          />
                        )}
                    </td>
                    <td className="table-cell"></td>
                  </tr>
                  {expandedRows.includes(disc.id!) && (
                    <tr>
                      <td colSpan={8}>
                        {" "}
                        {/* Use appropriate colspan */}
                        <div className="column-table">
                          <p className="detailed-text">
                            <strong>ID:</strong> {disc.id}
                          </p>
                          <p className="detailed-text">
                            <strong>Course: </strong>
                            {disc.course}
                          </p>
                          <p className="detailed-text">
                            <strong>Name: </strong>
                            {maskFirstName(disc.name)}
                          </p>
                          <p className="detailed-text">
                            <strong>Phone Number: </strong>
                            {maskPhoneNumber(disc.phoneNumber)}
                          </p>
                          <p className="detailed-text">
                            <strong>Brand: </strong>
                            {disc.brand}
                          </p>
                          <p className="detailed-text">
                            <strong>Disc: </strong>
                            {disc.disc}
                          </p>
                          <p className="detailed-text">
                            <strong>Color: </strong>
                            {disc.color}
                          </p>
                          <p className="detailed-text">
                            <strong>Bin: </strong>
                            {disc.bin}
                          </p>
                          <p className="detailed-text">
                            <strong>Date Found: </strong>
                            {disc.dateFound}
                          </p>
                          <p className="detailed-text">
                            <strong>Date Texted: </strong>
                            {disc.dateTexted}
                          </p>
                          <p className="detailed-text">
                            <strong>Date Claimed: </strong>
                            {disc.dateClaimed}
                          </p>
                          <p className="detailed-text">
                            <strong>Status: </strong>
                            {disc.status}
                          </p>
                          <p className="detailed-text">
                            <strong>Pickup Deadline: </strong>
                            {disc.pickupDeadline}
                          </p>
                          <p className="detailed-text">
                            <strong>Comments: </strong>
                            {disc.comments}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
            {/* <tbody>
            {filteredInventory.map((disc: Disc) => (
            <tr key={disc.id}>
              {editedDiscID===disc.id
              ? <td className="table-cell"><SaveOutlinedIcon sx={{ cursor: "pointer"}} onClick={stopEditing}></SaveOutlinedIcon></td>
              : <td className="table-cell"><EditOutlinedIcon sx={{ cursor: "pointer"}} onClick={() => startEditing(disc)}></EditOutlinedIcon></td>
              }
              <td className="table-cell">{disc.id}</td>
              <td className="table-cell">
                {editedDiscID === disc.id ? (
                  <input
                    type="text"
                    value={disc.name}
                    style={{ width: '90%' }}
                    onChange={(e) => {
                      disc.name = e.target.value;
                      setEditedDisc({ ...disc, name: e.target.value });
                    }}
                  />
                ) : (
                  disc.name
                )}
              </td>
              <td className="table-cell">
                {editedDiscID === disc.id ? (
                  <input
                    type="number"
                    value={disc.phoneNumber}
                    style={{ width: '90%' }}
                    onChange={(e) => {
                      disc.phoneNumber = e.target.value;
                      setEditedDisc({ ...disc, phoneNumber: e.target.value });
                    }}
                  />
                ) : (
                  disc.phoneNumber // Display text when not editing
                )}
              </td>
              <td className="table-cell">
                {editedDiscID === disc.id ? (
                  <input
                    type="text"
                    value={disc.disc}
                    style={{ width: '90%' }}
                    onChange={(e) => {
                      disc.disc = e.target.value;
                      setEditedDisc({ ...disc, disc: e.target.value });
                    }}
                  />
                ) : (
                  disc.disc // Display text when not editing
                )}
              </td>
              <td className="table-cell">
                {editedDiscID === disc.id ? (
                  <input
                    type="text"
                    value={disc.color}
                    style={{ width: '90%' }}
                    onChange={(e) => {
                      disc.color = e.target.value;
                      setEditedDisc({ ...disc, color: e.target.value });
                    }}
                  />
                ) : (
                  disc.color // Display text when not editing
                )}
              </td>
              <td className="table-cell">
                {editedDiscID === disc.id ? (
                  <input
                    type="text"
                    value={disc.bin}
                    style={{ width: '90%' }}
                    onChange={(e) => {
                      disc.bin = e.target.value;
                      setEditedDisc({ ...disc, bin: e.target.value });
                    }}
                  />
                ) : (
                  disc.bin // Display text when not editing
                )}
              </td>
              <td className="table-cell">
                {editedDiscID === disc.id ? (
                  <input
                    type="date"
                    value={disc.dateFound}
                    style={{ width: '90%' }}
                    onChange={(e) => {
                      disc.dateFound = e.target.value;
                      setEditedDisc({ ...disc, dateFound: e.target.value });
                    }}
                  />
                ) : (
                  disc.dateFound // Display text when not editing
                )}
              </td>
              <td className="table-cell">
                {editedDiscID === disc.id ? (
                  <input
                    type="text"
                    value={disc.comments!}
                    style={{ width: '90%' }}
                    onChange={(e) => {
                      disc.comments = e.target.value;
                      setEditedDisc({ ...disc, comments: e.target.value });
                    }}
                  />
                ) : (
                  disc.comments // Display text when not editing
                )}
              </td>
              <td className="table-cell">
                {isLoading ? (
                <div><CircularProgress/></div>
                ) : (
                    <div>
                        {disc.id!==claimedDisc && <button className="inventory-button" onClick={() => markAsClaimed(disc.id!.toString())}>Mark as Claimed</button>}
                    </div>
                    )}
                {successMessage && disc.id===claimedDisc && <div className="success-message">{successMessage}</div>}
              </td>
            </tr>
          ))}
        </tbody> */}
          </table>
        </div>
        <BackToTopButton />
      </div>
    </div>
  );
}

export default PublicInventory;
