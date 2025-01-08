import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import axios from 'axios';

const ProductDataGrid = () => {
  const [data, setData] = useState([]);
  const [dropdownValue, setDropdownValue] = useState('Location');
  const [filteredData, setFilteredData] = useState([]);
  const [totalRow, setTotalRow] = useState({});

  useEffect(() => {
    fetchData('locations');
  }, []);

  const fetchData = (type) => {
    const endpoint = type === 'Branch' ? 'branches' : 'locations';
    axios
      .get(`http://localhost:5000/api/${endpoint}`)
      .then((response) => {
        setData(response.data);
        setFilteredData(response.data);
        calculateTotal(response.data);
      })
      .catch((error) => {
        console.error('Error fetching data:', error.message);
      });
  };

  const calculateTotal = (data) => {
    const total = data.reduce(
      (acc, row) => {
        acc.potentialRevenue += parseFloat(row.potentialRevenue.replace(/[$,M]/g, '')) * 1e6;
        acc.competitorProcessingVolume += parseFloat(row.competitorProcessingVolume.replace(/[$,M]/g, '')) * 1e6;
        acc.competitorMerchant += row.competitorMerchant;
        acc.revenuePerAccount += parseFloat(row.revenuePerAccount.replace(/[$,K]/g, '')) * 1e3;
        acc.commercialDDAs += row.commercialDDAs;
        return acc;
      },
      {
        potentialRevenue: 0,
        competitorProcessingVolume: 0,
        competitorMerchant: 0,
        revenuePerAccount: 0,
        commercialDDAs: 0,
      }
    );

    setTotalRow({
      location: 'Total',
      potentialRevenue: `$${(total.potentialRevenue / 1e6).toFixed(2)}M`,
      competitorProcessingVolume: `$${(total.competitorProcessingVolume / 1e6).toFixed(2)}M`,
      competitorMerchant: total.competitorMerchant,
      revenuePerAccount: `$${(total.revenuePerAccount / 1e3).toFixed(2)}K`,
      commercialDDAs: total.commercialDDAs,
    });
  };

  const handleDropdownChange = (event) => {
    const value = event.target.value;
    setDropdownValue(value);
    fetchData(value);
  };

  const handleDeleteRow = (id, type) => {
    const endpoint = type === 'branch' ? 'branches' : 'locations';
    axios
      .delete(`http://localhost:5000/api/${endpoint}/${id}`)
      .then(() => {
        const updatedData = filteredData.filter(row => row._id !== id);
        setFilteredData(updatedData);
        calculateTotal(updatedData);
      })
      .catch(error => {
        console.error('Error deleting row:', error);
      });
  };

  const handleLocationClick = (location) => {
    axios
      .get(`http://localhost:5000/api/branches/${location}`)
      .then((response) => {
        setFilteredData(response.data);
      })
      .catch((error) => {
        console.error('Error fetching branches by location:', error);
      });
  };

  const columns = useMemo(
    () => [
      {
        Header: 'Location',
        accessor: 'location',
        Cell: ({ value }) => (
          <span onClick={() => handleLocationClick(value)} style={{ cursor: 'pointer', color: 'blue' }}>
            {value}
          </span>
        ),
      },
      {
        Header: 'Potential Revenue',
        accessor: 'potentialRevenue',
      },
      {
        Header: 'Competitor Processing Volume',
        accessor: 'competitorProcessingVolume',
      },
      {
        Header: 'Competitor Merchant',
        accessor: 'competitorMerchant',
      },
      {
        Header: 'Revenue/Account',
        accessor: 'revenuePerAccount',
      },
      {
        Header: 'Market Share',
        accessor: 'marketShare',
      },
      {
        Header: 'Commercial DDAs',
        accessor: 'commercialDDAs',
      },
      {
        Header: 'Action',
        Cell: ({ row }) => (
          <button onClick={() => handleDeleteRow(row.original._id, dropdownValue.toLowerCase())}>×</button>
        ),
      }
    ],
    [dropdownValue]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data: filteredData,
      initialState: { pageIndex: 0 },
    },
    useSortBy,
    usePagination
  );

  return (
    <div>
      <h1>Product Data Grid</h1>
      <select value={dropdownValue} onChange={handleDropdownChange}>
        <option value="Location">Location</option>
        <option value="Branch">Branch</option>
      </select>

      <table {...getTableProps()} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}
                >
                  {column.render('Header')}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? ' 🔽'
                        : ' 🔼'
                      : ''}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
        <tr>
            {Object.values(totalRow).map((cell, index) => (
            <td key={index} style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>
                {cell}
            </td>
            ))}
        </tr>
        {page.map(row => {
            prepareRow(row);
            return (
            <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                <td
                    {...cell.getCellProps()}
                    style={{ border: '1px solid #ddd', padding: '8px' }}
                >
                    {cell.render('Cell')}
                </td>
                ))}
            </tr>
            );
        })}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <div>
          Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, filteredData.length)} of {filteredData.length} entries
        </div>
        <div>
          <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
            {'<<'}
          </button>{' '}
          <button onClick={() => previousPage()} disabled={!canPreviousPage}>
            {'<'}
          </button>{' '}
          <button onClick={() => nextPage()} disabled={!canNextPage}>
            {'>'}
          </button>{' '}
          <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
            {'>>'}
          </button>{' '}
          <span>
            Page{' '}
            <strong>
              {pageIndex + 1} of {pageOptions.length}
            </strong>{' '}
          </span>
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
            }}
          >
            {[10, 20, 30, 40, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ProductDataGrid;